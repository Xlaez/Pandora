import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 160, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    passwordHash!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
    username!: string | null;

    @Column({ type: 'boolean', default: false })
    isEmailVerified!: boolean;

    @Column({ type: 'int', default: 25000 })
    balance!: number;

    @Column({ type: 'varchar', length: 24, default: '#D96B43' })
    avatarColor!: string;

    @Column({ type: 'varchar', length: 32, default: 'bowler' })
    hatStyle!: string;

    @Column({ type: 'varchar', length: 160, default: 'New arrival in Pandora' })
    bio!: string;

    @Column({ type: 'varchar', length: 64, default: 'exterior' })
    currentZone!: string;

    @Column({ type: 'double precision', default: 0 })
    posX!: number;

    @Column({ type: 'double precision', default: 0 })
    posY!: number;

    @Column({ type: 'double precision', default: 22 })
    posZ!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

export interface SafeAccount {
    id: string;
    email: string;
    username: string | null;
    isEmailVerified: boolean;
    balance: number;
    avatarColor: string;
    hatStyle: string;
    bio: string;
    currentZone: string;
    posX: number;
    posY: number;
    posZ: number;
    createdAt: Date;
}
