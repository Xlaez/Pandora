import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type LedgerCategory =
    | 'p2p_transfer'
    | 'house_purchase'
    | 'store_purchase'
    | 'city_stipend';

@Entity('economy_transactions')
export class EconomyTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    senderId!: string | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    senderUsername!: string | null;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    recipientId!: string | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    recipientUsername!: string | null;

    @Column({ type: 'int' })
    amount!: number;

    @Column({ type: 'varchar', length: 32 })
    category!: LedgerCategory;

    @Column({ type: 'varchar', length: 240 })
    note!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 96, unique: true })
    reference!: string;

    @CreateDateColumn()
    createdAt!: Date;
}

