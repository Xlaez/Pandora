import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationCategory =
    | 'transfer_received'
    | 'transfer_sent'
    | 'house_purchased'
    | 'house_sold'
    | 'sms_received'
    | 'stipend_claimed'
    | 'store_purchase'
    | 'visitor_entered';

@Entity('phone_notifications')
export class PhoneNotification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    accountId!: string;

    @Column({ type: 'varchar', length: 40 })
    type!: NotificationCategory;

    @Column({ type: 'varchar', length: 120 })
    title!: string;

    @Column({ type: 'varchar', length: 320 })
    body!: string;

    @Column({ type: 'int', nullable: true })
    amount!: number | null;

    @Column({ type: 'boolean', default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

