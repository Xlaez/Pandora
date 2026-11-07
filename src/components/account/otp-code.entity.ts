import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('otp_codes')
export class OtpCode {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'varchar', length: 160 })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    codeHash!: string;

    @Column({ type: 'timestamptz' })
    expiresAt!: Date;

    @Column({ type: 'int', default: 0 })
    attempts!: number;

    @Column({ type: 'timestamptz', nullable: true })
    consumedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;
}

