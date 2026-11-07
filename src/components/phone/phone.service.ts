import {
    BadRequestException,
    DService,
    getDataSource,
    NotFoundException,
} from '@dolphjs/dolph';
import { ILike } from 'typeorm';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { Account } from '../account/account.entity';
import { PhoneMessage } from './phone-message.entity';
import { NotificationCategory, PhoneNotification } from './phone-notification.entity';
import { SendSmsDto } from './phone.dto';

export interface CreateNotificationInput {
    accountId: string;
    type: NotificationCategory;
    title: string;
    body: string;
    amount?: number | null;
}

@DService()
export class PhoneService {
    constructor(private readonly realtimeBus: RealtimeBusService) {}

    private get messageRepo() {
        return getDataSource().getRepository(PhoneMessage);
    }

    private get notificationRepo() {
        return getDataSource().getRepository(PhoneNotification);
    }

    private get accountRepo() {
        return getDataSource().getRepository(Account);
    }

    async pushNotification(input: CreateNotificationInput): Promise<PhoneNotification> {
        const notification = this.notificationRepo.create({
            accountId: input.accountId,
            type: input.type,
            title: input.title,
            body: input.body,
            amount: input.amount ?? null,
            isRead: false,
        });
        const saved = await this.notificationRepo.save(notification);

        this.realtimeBus.emitToUser(input.accountId, 'phone:notification', {
            id: saved.id,
            type: saved.type,
            title: saved.title,
            body: saved.body,
            amount: saved.amount ?? undefined,
            createdAt: saved.createdAt.toISOString(),
        });

        return saved;
    }

    async sendSms(senderId: string, dto: SendSmsDto): Promise<PhoneMessage> {
        const sender = await this.accountRepo.findOne({ where: { id: senderId } });
        if (!sender || !sender.username) {
            throw new BadRequestException('Set your Pandora username before sending messages');
        }

        const cleanTarget = dto.recipientUsername.replace(/^@/, '').trim().toLowerCase();
        const recipient = await this.accountRepo.findOne({
            where: { username: ILike(cleanTarget) },
        });

        if (!recipient || !recipient.username) {
            throw new NotFoundException(`Citizen @${cleanTarget} was not found`);
        }

        if (recipient.id === sender.id) {
            throw new BadRequestException('Cannot send an SMS to yourself');
        }

        const msg = this.messageRepo.create({
            senderId: sender.id,
            senderUsername: sender.username,
            recipientId: recipient.id,
            recipientUsername: recipient.username,
            content: dto.content.trim(),
            isRead: false,
        });

        const saved = await this.messageRepo.save(msg);

        this.realtimeBus.emitToUser(recipient.id, 'phone:sms', saved);
        this.realtimeBus.emitToUser(sender.id, 'phone:sms', saved);

        await this.pushNotification({
            accountId: recipient.id,
            type: 'sms_received',
            title: `SMS from @${sender.username}`,
            body: saved.content.slice(0, 120),
        });

        return saved;
    }

    async getConversation(accountId: string, otherUsername: string): Promise<PhoneMessage[]> {
        const cleanTarget = otherUsername.replace(/^@/, '').trim().toLowerCase();
        const other = await this.accountRepo.findOne({
            where: { username: ILike(cleanTarget) },
        });

        if (!other) {
            throw new NotFoundException(`Citizen @${cleanTarget} not found`);
        }

        return this.messageRepo.find({
            where: [
                { senderId: accountId, recipientId: other.id },
                { senderId: other.id, recipientId: accountId },
            ],
            order: { createdAt: 'ASC' },
            take: 100,
        });
    }

    async getRecentMessages(accountId: string): Promise<PhoneMessage[]> {
        return this.messageRepo.find({
            where: [{ senderId: accountId }, { recipientId: accountId }],
            order: { createdAt: 'DESC' },
            take: 80,
        });
    }

    async getNotifications(accountId: string): Promise<PhoneNotification[]> {
        return this.notificationRepo.find({
            where: { accountId },
            order: { createdAt: 'DESC' },
            take: 40,
        });
    }

    async markNotificationsRead(accountId: string): Promise<{ updated: boolean }> {
        await this.notificationRepo.update({ accountId, isRead: false }, { isRead: true });
        return { updated: true };
    }
}

