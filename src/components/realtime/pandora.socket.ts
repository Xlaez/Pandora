import {
    DolphSocketServiceHandler,
    DService,
    getDataSource,
    MemDB,
    Socket,
    SocketComponent,
} from '@dolphjs/dolph';
import { randomUUID } from 'crypto';
import type { Socket as ClientSocket } from 'socket.io';
import { PandoraJwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { PlayerSpatialState, RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { RedisService } from '../../shared/services/redis.service';
import { Account } from '../account/account.entity';

interface MovePayload {
    x: number;
    y: number;
    z: number;
    rotationY: number;
}

interface ZoneSwitchPayload {
    zoneId: string;
    x?: number;
    y?: number;
    z?: number;
}

interface AppearancePayload {
    username?: string;
    avatarColor?: string;
    hatStyle?: string;
}

interface PublicChatPayload {
    message: string;
}

@DService()
export class PandoraSocketService extends DolphSocketServiceHandler {
    declare RealtimeBusService: RealtimeBusService;
    declare RedisService: RedisService;

    private readonly presenceDb = new MemDB<PlayerSpatialState>();
    private readonly socketToAccount = new Map<string, string>();
    private readonly dirtyAccounts = new Set<string>();
    private tickTimer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        super();
        this.initialize();
    }

    private get accountRepo() {
        return getDataSource().getRepository(Account);
    }

    private clampCoord(value: number, min: number, max: number): number {
        if (!Number.isFinite(value)) return 0;
        return Math.max(min, Math.min(max, value));
    }

    private initialize(): void {
        this.RealtimeBusService.bindServer(this.socket);

        this.tickTimer = setInterval(() => {
            this.flushSpatialDeltas();
        }, 50);
        this.tickTimer.unref();

        this.socket.on('connection', async (client: ClientSocket) => {
            const payload = client.data?.payload as PandoraJwtPayload | undefined;
            if (!payload?.sub) {
                client.disconnect(true);
                return;
            }

            const accountId = payload.sub;
            const account = await this.accountRepo.findOne({ where: { id: accountId } }).catch(() => null);

            const username = account?.username || payload.info?.username || `citizen_${accountId.slice(0, 5)}`;
            const avatarColor = account?.avatarColor || '#D96B43';
            const hatStyle = account?.hatStyle || 'bowler';
            const zoneId = account?.currentZone || 'exterior';
            const startX = account?.posX ?? 0;
            const startY = account?.posY ?? 0;
            const startZ = account?.posZ ?? 22;

            const state: PlayerSpatialState = {
                accountId,
                username,
                avatarColor,
                hatStyle,
                x: startX,
                y: startY,
                z: startZ,
                rotationY: 0,
                zoneId,
                updatedAt: Date.now(),
            };

            if (this.presenceDb.has(accountId)) {
                this.presenceDb.remove(accountId);
            }
            this.presenceDb.add(accountId, state);
            this.socketToAccount.set(client.id, accountId);

            await this.RedisService.set(`pandora:online:${accountId}`, JSON.stringify(state), 300);

            client.join(`user:${accountId}`);
            client.join(`zone:${zoneId}`);

            const zonePlayers = this.presenceDb
                .getAllValues()
                .filter((p) => p.zoneId === zoneId);

            client.emit('world:snapshot', {
                zoneId,
                players: zonePlayers,
                onlineCount: this.presenceDb.getAllKeys().length,
            });

            client.to(`zone:${zoneId}`).emit('player:joined', state);
            this.socket.emit('world:online-count', {
                onlineCount: this.presenceDb.getAllKeys().length,
                citizens: this.presenceDb.getAllValues().map((p) => ({
                    accountId: p.accountId,
                    username: p.username,
                    avatarColor: p.avatarColor,
                    hatStyle: p.hatStyle,
                    zoneId: p.zoneId,
                })),
            });

            client.on('player:move', (move: MovePayload) => {
                const current = this.presenceDb.get(accountId);
                if (!current || !move) return;

                current.x = this.clampCoord(Number(move.x), -140, 140);
                current.y = this.clampCoord(Number(move.y), -2, 30);
                current.z = this.clampCoord(Number(move.z), -140, 140);
                current.rotationY = Number.isFinite(Number(move.rotationY)) ? Number(move.rotationY) : 0;
                current.updatedAt = Date.now();

                this.dirtyAccounts.add(accountId);
            });

            client.on('player:zone', async (switchData: ZoneSwitchPayload) => {
                const current = this.presenceDb.get(accountId);
                if (!current || !switchData?.zoneId) return;

                const oldZone = current.zoneId;
                const nextZone = String(switchData.zoneId).slice(0, 64);

                if (oldZone !== nextZone) {
                    client.leave(`zone:${oldZone}`);
                    client.to(`zone:${oldZone}`).emit('player:left', { accountId });
                    client.join(`zone:${nextZone}`);
                }

                current.zoneId = nextZone;
                if (typeof switchData.x === 'number') {
                    current.x = this.clampCoord(switchData.x, -140, 140);
                }
                if (typeof switchData.y === 'number') {
                    current.y = this.clampCoord(switchData.y, -2, 30);
                }
                if (typeof switchData.z === 'number') {
                    current.z = this.clampCoord(switchData.z, -140, 140);
                }
                current.updatedAt = Date.now();

                const playersInNewZone = this.presenceDb
                    .getAllValues()
                    .filter((p) => p.zoneId === nextZone);

                client.emit('world:snapshot', {
                    zoneId: nextZone,
                    players: playersInNewZone,
                    onlineCount: this.presenceDb.getAllKeys().length,
                });

                client.to(`zone:${nextZone}`).emit('player:joined', current);
                await this.RedisService.set(`pandora:online:${accountId}`, JSON.stringify(current), 300);
            });

            client.on('player:appearance', (appearance: AppearancePayload) => {
                const current = this.presenceDb.get(accountId);
                if (!current || !appearance) return;

                if (appearance.username) current.username = String(appearance.username).slice(0, 32);
                if (appearance.avatarColor) current.avatarColor = String(appearance.avatarColor).slice(0, 24);
                if (appearance.hatStyle) current.hatStyle = String(appearance.hatStyle).slice(0, 32);
                current.updatedAt = Date.now();

                this.dirtyAccounts.add(accountId);
            });

            client.on('chat:public', (chat: PublicChatPayload) => {
                const current = this.presenceDb.get(accountId);
                if (!current || !chat?.message) return;

                const cleanMessage = String(chat.message).trim().slice(0, 280);
                if (!cleanMessage) return;

                this.socket.emit('chat:message', {
                    id: randomUUID(),
                    accountId,
                    username: current.username,
                    avatarColor: current.avatarColor,
                    zoneId: current.zoneId,
                    message: cleanMessage,
                    createdAt: new Date().toISOString(),
                });
            });

            client.on('disconnect', async () => {
                const mappedAccount = this.socketToAccount.get(client.id);
                this.socketToAccount.delete(client.id);

                if (!mappedAccount) return;
                const existing = this.presenceDb.get(mappedAccount);
                if (existing) {
                    this.presenceDb.remove(mappedAccount);
                    this.dirtyAccounts.delete(mappedAccount);
                    this.socket.to(`zone:${existing.zoneId}`).emit('player:left', {
                        accountId: mappedAccount,
                    });

                    await this.accountRepo
                        .update(
                            { id: mappedAccount },
                            {
                                posX: existing.x,
                                posY: existing.y,
                                posZ: existing.z,
                                currentZone: existing.zoneId,
                            },
                        )
                        .catch(() => undefined);
                }

                await this.RedisService.del(`pandora:online:${mappedAccount}`);
                this.socket.emit('world:online-count', {
                    onlineCount: this.presenceDb.getAllKeys().length,
                    citizens: this.presenceDb.getAllValues().map((p) => ({
                        accountId: p.accountId,
                        username: p.username,
                        avatarColor: p.avatarColor,
                        hatStyle: p.hatStyle,
                        zoneId: p.zoneId,
                    })),
                });
            });
        });
    }

    private flushSpatialDeltas(): void {
        if (this.dirtyAccounts.size === 0) return;

        const byZone = new Map<string, PlayerSpatialState[]>();

        for (const accountId of this.dirtyAccounts) {
            const state = this.presenceDb.get(accountId);
            if (!state) continue;

            const bucket = byZone.get(state.zoneId);
            if (bucket) {
                bucket.push(state);
            } else {
                byZone.set(state.zoneId, [state]);
            }
        }

        this.dirtyAccounts.clear();

        for (const [zoneId, updates] of byZone.entries()) {
            this.socket.to(`zone:${zoneId}`).emit('world:state-delta', {
                zoneId,
                updates,
            });
        }
    }
}

@Socket({
    services: [RealtimeBusService, RedisService],
    socketServices: [PandoraSocketService],
})
export class PandoraSocketComponent extends SocketComponent {}

