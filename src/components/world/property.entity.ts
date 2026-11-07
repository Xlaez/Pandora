import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type RoofStyle = 'mansard' | 'gable' | 'flat_parapet' | 'townhouse';
export type InteriorTheme = 'georgian_velvet' | 'shoreditch_industrial' | 'mayfair_marble' | 'chelsea_botanical';

@Entity('pandora_properties')
export class Property {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 64, unique: true })
    slug!: string;

    @Column({ type: 'varchar', length: 120 })
    name!: string;

    @Column({ type: 'varchar', length: 64 })
    district!: string;

    @Column({ type: 'varchar', length: 120 })
    address!: string;

    @Column({ type: 'varchar', length: 320 })
    description!: string;

    @Column({ type: 'int' })
    price!: number;

    @Column({ type: 'boolean', default: true })
    isForSale!: boolean;

    @Column({ type: 'boolean', default: false })
    isLocked!: boolean;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    ownerId!: string | null;

    @Column({ type: 'varchar', length: 32, nullable: true })
    ownerUsername!: string | null;

    @Column({ type: 'double precision' })
    posX!: number;

    @Column({ type: 'double precision' })
    posZ!: number;

    @Column({ type: 'double precision', default: 0 })
    rotationY!: number;

    @Column({ type: 'double precision', default: 10 })
    width!: number;

    @Column({ type: 'double precision', default: 10 })
    depth!: number;

    @Column({ type: 'int', default: 3 })
    floors!: number;

    @Column({ type: 'varchar', length: 24, default: '#B85435' })
    facadeColor!: string;

    @Column({ type: 'varchar', length: 24, default: '#F2E9DC' })
    trimColor!: string;

    @Column({ type: 'varchar', length: 32, default: 'townhouse' })
    roofStyle!: RoofStyle;

    @Column({ type: 'varchar', length: 48, default: 'georgian_velvet' })
    interiorTheme!: InteriorTheme;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

