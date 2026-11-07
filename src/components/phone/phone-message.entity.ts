import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('phone_messages')
export class PhoneMessage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    senderId!: string;

    @Column({ type: 'varchar', length: 32 })
    senderUsername!: string;

    @Index()
    @Column({ type: 'uuid' })
    recipientId!: string;

    @Column({ type: 'varchar', length: 32 })
    recipientUsername!: string;

    @Column({ type: 'varchar', length: 500 })
    content!: string;

    @Column({ type: 'boolean', default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

