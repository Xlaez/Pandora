import {
    BadRequestException,
    compareHashedStringAsync,
    ConflictException,
    DService,
    generateJWTwithHMAC,
    getDataSource,
    hashString,
    NotFoundException,
    UnauthorizedException,
} from '@dolphjs/dolph';
import { ILike, Not, IsNull } from 'typeorm';
import { env } from '../../shared/configs/env.config';
import { PandoraJwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { Account, SafeAccount } from './account.entity';
import {
    LoginAccountDto,
    RegisterAccountDto,
    ResendOtpDto,
    SetUsernameDto,
    UpdateProfileDto,
    VerifyOtpDto,
} from './account.dto';
import { OtpService } from './otp.service';

@DService()
export class AccountService {
    constructor(private readonly otpService: OtpService) {}

    private get accountRepository() {
        return getDataSource().getRepository(Account);
    }

    toSafeAccount(account: Account): SafeAccount {
        return {
            id: account.id,
            email: account.email,
            username: account.username,
            isEmailVerified: account.isEmailVerified,
            balance: account.balance,
            avatarColor: account.avatarColor,
            hatStyle: account.hatStyle,
            bio: account.bio,
            currentZone: account.currentZone,
            posX: account.posX,
            posY: account.posY,
            posZ: account.posZ,
            createdAt: account.createdAt,
        };
    }

    signToken(account: Account): string {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const payload: PandoraJwtPayload = {
            sub: account.id,
            iat: nowSeconds,
            exp: nowSeconds + env.jwt.expiresInSeconds,
            info: {
                email: account.email,
                username: account.username,
                isVerified: account.isEmailVerified,
            },
        };

        return generateJWTwithHMAC({
            payload,
            secret: env.jwt.secret,
        });
    }

    async register(dto: RegisterAccountDto) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.accountRepository.findOne({ where: { email } });

        if (existing && existing.isEmailVerified) {
            throw new ConflictException('An account with this email is already registered');
        }

        let account: Account;
        const passwordHash = await hashString(dto.password);

        if (existing) {
            existing.passwordHash = passwordHash;
            account = await this.accountRepository.save(existing);
        } else {
            const created = this.accountRepository.create({
                email,
                passwordHash,
                username: null,
                isEmailVerified: false,
                balance: env.economy.starterBalance,
                avatarColor: '#D96B43',
                hatStyle: 'bowler',
                bio: 'Citizen of Pandora',
                currentZone: 'exterior',
                posX: 0,
                posY: 0,
                posZ: 22,
            });
            account = await this.accountRepository.save(created);
        }

        const otp = await this.otpService.issueOtp(email);

        return {
            message: 'Verification code dispatched to your email',
            email: account.email,
            requiresVerification: true,
            devOtpCode: otp.code,
            formattedSms: otp.formattedSms,
            account: this.toSafeAccount(account),
        };
    }

    async verifyOtp(dto: VerifyOtpDto) {
        const email = dto.email.trim().toLowerCase();
        const account = await this.accountRepository.findOne({ where: { email } });

        if (!account) {
            throw new NotFoundException('Account not found for this email');
        }

        const isValid = await this.otpService.verifyOtp(email, dto.code.trim());
        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired 6-digit verification code');
        }

        account.isEmailVerified = true;
        const saved = await this.accountRepository.save(account);
        const token = this.signToken(saved);

        return {
            message: 'Email verified successfully',
            token,
            needsUsername: !saved.username,
            account: this.toSafeAccount(saved),
        };
    }

    async resendOtp(dto: ResendOtpDto) {
        const email = dto.email.trim().toLowerCase();
        const account = await this.accountRepository.findOne({ where: { email } });

        if (!account) {
            throw new NotFoundException('No account found with that email');
        }

        if (account.isEmailVerified) {
            throw new ConflictException('This account is already verified');
        }

        const otp = await this.otpService.issueOtp(email);
        return {
            message: 'A new 6-digit verification code has been sent',
            email,
            devOtpCode: otp.code,
            formattedSms: otp.formattedSms,
        };
    }

    async login(dto: LoginAccountDto) {
        const email = dto.email.trim().toLowerCase();
        const account = await this.accountRepository.findOne({ where: { email } });

        if (!account) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await compareHashedStringAsync(dto.password, account.passwordHash);
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!account.isEmailVerified) {
            const otp = await this.otpService.issueOtp(email);
            return {
                message: 'Please verify your email with the 6-digit OTP to continue',
                requiresVerification: true,
                email: account.email,
                devOtpCode: otp.code,
                formattedSms: otp.formattedSms,
                token: null,
                needsUsername: !account.username,
                account: this.toSafeAccount(account),
            };
        }

        const token = this.signToken(account);
        return {
            message: 'Welcome back to Pandora',
            requiresVerification: false,
            token,
            needsUsername: !account.username,
            account: this.toSafeAccount(account),
        };
    }

    async setUsername(accountId: string, dto: SetUsernameDto) {
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        if (!account.isEmailVerified) {
            throw new BadRequestException('Please verify your email before choosing a username');
        }

        const desiredUsername = dto.username.trim().toLowerCase();
        const conflicting = await this.accountRepository.findOne({
            where: { username: ILike(desiredUsername) },
        });

        if (conflicting && conflicting.id !== account.id) {
            throw new ConflictException(`Username @${desiredUsername} is already taken in Pandora`);
        }

        account.username = desiredUsername;
        if (dto.avatarColor) account.avatarColor = dto.avatarColor;
        if (dto.hatStyle) account.hatStyle = dto.hatStyle;
        if (dto.bio !== undefined) account.bio = dto.bio.trim() || 'Citizen of Pandora';

        const saved = await this.accountRepository.save(account);
        const token = this.signToken(saved);

        return {
            message: `Username @${saved.username} claimed`,
            token,
            account: this.toSafeAccount(saved),
        };
    }

    async updateProfile(accountId: string, dto: UpdateProfileDto): Promise<SafeAccount> {
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        if (dto.avatarColor) account.avatarColor = dto.avatarColor;
        if (dto.hatStyle) account.hatStyle = dto.hatStyle;
        if (dto.bio !== undefined) account.bio = dto.bio.trim();

        const saved = await this.accountRepository.save(account);
        return this.toSafeAccount(saved);
    }

    async getProfile(accountId: string): Promise<SafeAccount> {
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }
        return this.toSafeAccount(account);
    }

    async findByUsername(username: string): Promise<Account | null> {
        const clean = username.replace(/^@/, '').trim().toLowerCase();
        if (!clean) return null;
        return this.accountRepository.findOne({
            where: { username: ILike(clean) },
        });
    }

    async listCitizens(search?: string): Promise<SafeAccount[]> {
        const trimmed = search?.replace(/^@/, '').trim();
        const accounts = await this.accountRepository.find({
            where: trimmed
                ? { username: ILike(`%${trimmed}%`), isEmailVerified: true }
                : { username: Not(IsNull()), isEmailVerified: true },
            order: { createdAt: 'DESC' },
            take: 50,
        });

        return accounts.map((a) => this.toSafeAccount(a));
    }

    async greet() {
        return { message: "you've reached the account endpoint." };
    }
}
