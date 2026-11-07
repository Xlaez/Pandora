import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendSmsDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    recipientUsername!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    content!: string;
}

export class ThreadParamDto {
    @IsString()
    @IsNotEmpty()
    username!: string;
}

