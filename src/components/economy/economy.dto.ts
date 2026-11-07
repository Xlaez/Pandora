import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class TransferMoneyDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    recipientUsername!: string;

    @IsInt()
    @Min(1)
    @Max(10000000)
    amount!: number;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    note?: string;

    @IsOptional()
    @IsString()
    @MaxLength(64)
    idempotencyKey?: string;
}

export class ClaimStipendDto {
    @IsOptional()
    @IsString()
    @MaxLength(64)
    activity?: string;
}

