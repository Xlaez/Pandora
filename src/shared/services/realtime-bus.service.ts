import { DService } from '@dolphjs/dolph';
import type { Server as SocketServer } from 'socket.io';

export interface PlayerSpatialState {
    accountId: string;
    username: string;
    avatarColor: string;
    hatStyle: string;
    x: number;
    y: number;
    z: number;
    rotationY: number;
    zoneId: string;
    updatedAt: number;
}

export interface LiveNotificationPayload {
    id: string;
    type: 'transfer_received' | 'transfer_sent' | 'house_purchased' | 'house_sold' | 'sms_received' | 'stipend_claimed' | 'store_purchase' | 'visitor_entered';
    title: string;
    body: string;
    amount?: number;
    createdAt: string;
}

@DService()
export class RealtimeBusService {
    private io: SocketServer | null = null;

    bindServer(server: SocketServer): void {
        this.io = server;
    }

    getServer(): SocketServer | null {
        return this.io;
    }

    emitToUser(accountId: string, event: string, payload: unknown): void {
        if (!this.io) return;
        this.io.to(`user:${accountId}`).emit(event, payload);
    }

    emitToZone(zoneId: string, event: string, payload: unknown): void {
        if (!this.io) return;
        this.io.to(`zone:${zoneId}`).emit(event, payload);
    }

    emitToAll(event: string, payload: unknown): void {
        if (!this.io) return;
        this.io.emit(event, payload);
    }
}

