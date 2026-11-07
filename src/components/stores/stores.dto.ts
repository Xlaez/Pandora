import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class StoreSlugParamDto {
    @IsString()
    @IsNotEmpty()
    slug!: string;
}

export class InventoryIdParamDto {
    @IsString()
    @IsNotEmpty()
    id!: string;
}

export class PurchaseStoreItemDto {
    @IsString()
    @IsNotEmpty()
    sku!: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(20)
    quantity?: number;
}

