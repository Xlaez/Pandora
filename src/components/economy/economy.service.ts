import {
    BadRequestException,
    ConflictException,
    DService,
    getDataSource,
    NotFoundException,
} from '@dolphjs/dolph';
import { randomUUID } from 'crypto';
import { env } from '../../shared/configs/env.config';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { RedisService } from '../../shared/services/redis.service';
import { Account } from '../account/account.entity';
import { PhoneService } from '../phone/phone.service';
import { ClaimStipendDto, TransferMoneyDto } from './economy.dto';
import { EconomyTransaction } from './transaction.entity';

@DService()
export class EconomyService {
    constructor(
        private readonly redisService: RedisService,
        private readonly realtimeBus: RealtimeBusService,
        private readonly phoneService: PhoneService,
    ) {}

    private get transactionRepo() {
        return getDataSource().getRepository(EconomyTransaction);
    }

    private get accountRepo() {
        return getDataSource().getRepository(Account);
    }

    async transferMoney(senderAccountId: string, dto: TransferMoneyDto) {
        const cleanRecipientUsername = dto.recipientUsername.replace(/^@/, '').trim().toLowerCase();
        if (!cleanRecipientUsername) {
            throw new BadRequestException('Recipient username is required');
        }

        const reference = dto.idempotencyKey?.trim()
            ? `p2p:${senderAccountId}:${dto.idempotencyKey.trim()}`
            : `p2p:${randomUUID()}`;

        const existingTx = await this.transactionRepo.findOne({ where: { reference } });
        if (existingTx) {
            const currentSender = await this.accountRepo.findOne({ where: { id: senderAccountId } });
            return {
                message: 'Transfer already processed',
                transaction: existingTx,
                balance: currentSender?.balance ?? 0,
            };
        }

        const lockToken = await this.redisService.acquireLock(`transfer:${senderAccountId}`, 8);
        if (!lockToken) {
            throw new ConflictException('Another transfer is currently in progress');
        }

        try {
            const dataSource = getDataSource();
            const result = await dataSource.transaction(async (manager) => {
                const senderLookup = await manager.findOne(Account, { where: { id: senderAccountId } });
                if (!senderLookup || !senderLookup.username) {
                    throw new BadRequestException('You must set a username before sending money');
                }

                const recipientLookup = await manager
                    .createQueryBuilder(Account, 'account')
                    .where('LOWER(account.username) = :username', { username: cleanRecipientUsername })
                    .getOne();

                if (!recipientLookup || !recipientLookup.username) {
                    throw new NotFoundException(`Citizen @${cleanRecipientUsername} does not exist in Pandora`);
                }

                if (recipientLookup.id === senderLookup.id) {
                    throw new BadRequestException('Cannot transfer money to yourself');
                }

                const orderedIds = [senderLookup.id, recipientLookup.id].sort();
                for (const id of orderedIds) {
                    await manager
                        .createQueryBuilder(Account, 'acc')
                        .setLock('pessimistic_write')
                        .where('acc.id = :id', { id })
                        .getOne();
                }

                const sender = await manager.findOneOrFail(Account, { where: { id: senderLookup.id } });
                const recipient = await manager.findOneOrFail(Account, { where: { id: recipientLookup.id } });

                if (sender.balance < dto.amount) {
                    throw new BadRequestException(
                        `Insufficient Royal Bank funds (Balance: £${sender.balance.toLocaleString()}, Required: £${dto.amount.toLocaleString()})`,
                    );
                }

                sender.balance -= dto.amount;
                recipient.balance += dto.amount;

                await manager.save(Account, [sender, recipient]);

                const txRecord = manager.create(EconomyTransaction, {
                    senderId: sender.id,
                    senderUsername: sender.username,
                    recipientId: recipient.id,
                    recipientUsername: recipient.username,
                    amount: dto.amount,
                    category: 'p2p_transfer',
                    note: dto.note?.trim() || `RoyalPay transfer to @${recipient.username}`,
                    reference,
                });

                const savedTx = await manager.save(EconomyTransaction, txRecord);

                return {
                    savedTx,
                    senderBalance: sender.balance,
                    recipientBalance: recipient.balance,
                    senderId: sender.id,
                    senderUsername: sender.username,
                    recipientId: recipient.id,
                    recipientUsername: recipient.username,
                };
            });

            this.realtimeBus.emitToUser(result.senderId, 'wallet:updated', {
                balance: result.senderBalance,
                transaction: result.savedTx,
            });

            this.realtimeBus.emitToUser(result.recipientId, 'wallet:updated', {
                balance: result.recipientBalance,
                transaction: result.savedTx,
            });

            await this.phoneService.pushNotification({
                accountId: result.recipientId,
                type: 'transfer_received',
                title: `£${dto.amount.toLocaleString()} Received`,
                body: `@${result.senderUsername} sent you £${dto.amount.toLocaleString()}${dto.note ? ` — "${dto.note}"` : ''}`,
                amount: dto.amount,
            });

            await this.phoneService.pushNotification({
                accountId: result.senderId,
                type: 'transfer_sent',
                title: `£${dto.amount.toLocaleString()} Sent`,
                body: `Transferred £${dto.amount.toLocaleString()} to @${result.recipientUsername}`,
                amount: -dto.amount,
            });

            return {
                message: `Sent £${dto.amount.toLocaleString()} to @${result.recipientUsername}`,
                transaction: result.savedTx,
                balance: result.senderBalance,
            };
        } finally {
            await this.redisService.releaseLock(`transfer:${senderAccountId}`, lockToken);
        }
    }

    async claimStipend(accountId: string, dto?: ClaimStipendDto) {
        const cooldownKey = `pandora:stipend:cooldown:${accountId}`;
        const remaining = await this.redisService.getTtl(cooldownKey);

        if (remaining > 0) {
            throw new BadRequestException(`Next Pandora civic stipend available in ${remaining}s`);
        }

        const amount = env.economy.cityStipendAmount;
        const activityLabel = dto?.activity?.trim() || 'City of Pandora Civic Duty & Commerce Grant';

        const dataSource = getDataSource();
        const result = await dataSource.transaction(async (manager) => {
            const account = await manager
                .createQueryBuilder(Account, 'acc')
                .setLock('pessimistic_write')
                .where('acc.id = :id', { id: accountId })
                .getOne();

            if (!account) {
                throw new NotFoundException('Account not found');
            }

            account.balance += amount;
            await manager.save(Account, account);

            const tx = manager.create(EconomyTransaction, {
                senderId: null,
                senderUsername: 'royal_treasury',
                recipientId: account.id,
                recipientUsername: account.username ?? account.email,
                amount,
                category: 'city_stipend',
                note: activityLabel,
                reference: `stipend:${randomUUID()}`,
            });
            const savedTx = await manager.save(EconomyTransaction, tx);

            return { account, savedTx };
        });

        await this.redisService.set(cooldownKey, '1', env.economy.cityStipendCooldownSeconds);

        this.realtimeBus.emitToUser(accountId, 'wallet:updated', {
            balance: result.account.balance,
            transaction: result.savedTx,
        });

        await this.phoneService.pushNotification({
            accountId,
            type: 'stipend_claimed',
            title: `+£${amount.toLocaleString()} Treasury Stipend`,
            body: `Credited £${amount.toLocaleString()} for ${activityLabel}`,
            amount,
        });

        return {
            message: `Claimed £${amount.toLocaleString()} from the Royal Treasury`,
            balance: result.account.balance,
            transaction: result.savedTx,
            cooldownSeconds: env.economy.cityStipendCooldownSeconds,
        };
    }

    async getLedger(accountId: string) {
        const account = await this.accountRepo.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const transactions = await this.transactionRepo.find({
            where: [{ senderId: accountId }, { recipientId: accountId }],
            order: { createdAt: 'DESC' },
            take: 60,
        });

        const stipendCooldown = await this.redisService.getTtl(`pandora:stipend:cooldown:${accountId}`);

        return {
            balance: account.balance,
            stipendCooldownSeconds: stipendCooldown,
            stipendAmount: env.economy.cityStipendAmount,
            transactions,
        };
    }
}

