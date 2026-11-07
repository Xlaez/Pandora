import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type StoreItemCategory = 'apparel' | 'gadget' | 'refreshment' | 'decor';

@Entity('citizen_inventory')
export class InventoryItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    accountId!: string;

    @Column({ type: 'varchar', length: 64 })
    itemSku!: string;

    @Column({ type: 'varchar', length: 120 })
    itemName!: string;

    @Column({ type: 'varchar', length: 64 })
    storeSlug!: string;

    @Column({ type: 'varchar', length: 32 })
    category!: StoreItemCategory;

    @Column({ type: 'varchar', length: 32 })
    icon!: string;

    @Column({ type: 'int' })
    pricePaid!: number;

    @Column({ type: 'int', default: 1 })
    quantity!: number;

    @Column({ type: 'boolean', default: false })
    isEquipped!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

