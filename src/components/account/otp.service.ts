import {
    BadRequestException,
    compareHashedStringAsync,
    DService,
    generateVerificationCode,
    getDataSource,
    hashString,
    logger,
} from '@dolphjs/dolph';
import { IsNull } from 'typeorm';
import { RedisService } from '../../shared/services/redis.service';
import { OtpCode } from './otp-code.entity';

const OTP_TTL_SECONDS = 15 * 60;
const OTP_COOLDOWN_SECONDS = 15;
const MAX_VERIFY_ATTEMPTS = 5;

export interface IssuedOtpResult {
    code: string;
    expiresInSeconds: number;
    formattedSms: string;
}

@DService()
export class OtpService {
    constructor(private readonly redisService: RedisService) {}

    private get otpRepo() {
        return getDataSource().getRepository(OtpCode);
    }

    async issueOtp(rawEmail: string, hostDomain = 'localhost'): Promise<IssuedOtpResult> {
        const email = rawEmail.trim().toLowerCase();
        const cooldownKey = `pandora:otp:cooldown:${email}`;
        const existingCooldown = await this.redisService.getTtl(cooldownKey);

        if (existingCooldown > 0) {
            throw new BadRequestException(`Please wait ${existingCooldown}s before requesting another verification code`);
        }

        const code = generateVerificationCode(6);
        const codeHash = await hashString(code);
        const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

        const record = this.otpRepo.create({
            email,
            codeHash,
            expiresAt,
            attempts: 0,
            consumedAt: null,
        });
        await this.otpRepo.save(record);

        await this.redisService.set(cooldownKey, '1', OTP_COOLDOWN_SECONDS);
        await this.redisService.set(`pandora:otp:latest:${email}`, code, OTP_TTL_SECONDS);

        const cleanDomain = hostDomain.replace(/^https?:\/\//, '').split(':')[0].split('/')[0] || 'localhost';
        const formattedSms = `Your Pandora citizen verification code is ${code}.\n\n@${cleanDomain} #${code}`;

        logger.info(`[Pandora Mail/SMS Dispatch] To=${email} Code=${code}`);

        return {
            code,
            expiresInSeconds: OTP_TTL_SECONDS,
            formattedSms,
        };
    }

    async verifyOtp(rawEmail: string, code: string): Promise<boolean> {
        const email = rawEmail.trim().toLowerCase();
        const record = await this.otpRepo.findOne({
            where: { email, consumedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });

        if (!record) {
            return false;
        }

        if (record.expiresAt.getTime() < Date.now()) {
            return false;
        }

        const isValid = await compareHashedStringAsync(code, record.codeHash);
        if (!isValid) {
            record.attempts += 1;
            if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
                record.consumedAt = new Date();
            }
            await this.otpRepo.save(record);
            return false;
        }

        record.consumedAt = new Date();
        await this.otpRepo.save(record);
        await this.redisService.del(`pandora:otp:latest:${email}`);
        await this.redisService.del(`pandora:otp:cooldown:${email}`);
        return true;
    }
}

