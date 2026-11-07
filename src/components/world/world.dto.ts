import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { InteriorTheme } from './property.entity';

export class PropertyIdParamDto {
    @IsString()
    @IsNotEmpty()
    id!: string;
}

export class UpdatePropertySettingsDto {
    @IsOptional()
    @IsBoolean()
    isLocked?: boolean;

    @IsOptional()
    @IsBoolean()
    isForSale?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1000)
    @Max(50000000)
    price?: number;

    @IsOptional()
    @IsIn(['georgian_velvet', 'shoreditch_industrial', 'mayfair_marble', 'chelsea_botanical'])
    interiorTheme?: InteriorTheme;
}

