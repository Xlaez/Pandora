import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterAccountDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(72)
    password!: string;
}

export class VerifyOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/, { message: 'OTP code must be a 6-digit number' })
    code!: string;
}

export class ResendOtpDto {
    @IsEmail()
    email!: string;
}

export class LoginAccountDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(1)
    password!: string;
}

export class SetUsernameDto {
    @IsString()
    @MinLength(3)
    @MaxLength(24)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username may only contain letters, numbers, and underscores',
    })
    username!: string;

    @IsOptional()
    @IsString()
    @MaxLength(24)
    avatarColor?: string;

    @IsOptional()
    @IsString()
    @MaxLength(32)
    hatStyle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    bio?: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(24)
    avatarColor?: string;

    @IsOptional()
    @IsString()
    @MaxLength(32)
    hatStyle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    bio?: string;
}

export class CitizenQueryDto {
    @IsOptional()
    @IsString()
    search?: string;
}
