import { AccountService } from './account.service';
import { OtpService } from './otp.service';
import { RedisService } from '../../shared/services/redis.service';

describe('AccountService', () => {
    let redisService: RedisService;
    let otpService: OtpService;
    let service: AccountService;

    beforeEach(() => {
        redisService = new RedisService();
        otpService = new OtpService(redisService);
        service = new AccountService(otpService);
    });

    afterEach(async () => {
        await redisService.disconnect();
    });

    it('is defined and signs valid HMAC JWT tokens', () => {
        expect(service).toBeDefined();
        const token = service.signToken({
            id: '00000000-0000-4000-8000-000000000001',
            email: 'citizen@pandora.uk',
            passwordHash: 'hash',
            username: 'lord_byron',
            isEmailVerified: true,
            balance: 25000,
            avatarColor: '#D96B43',
            hatStyle: 'tophat',
            bio: 'Poet of Mayfair',
            currentZone: 'exterior',
            posX: 0,
            posY: 0,
            posZ: 22,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
    });

    it('strips passwordHash in toSafeAccount', () => {
        const safe = service.toSafeAccount({
            id: '00000000-0000-4000-8000-000000000002',
            email: 'eliza@pandora.uk',
            passwordHash: 'super_secret_hash',
            username: 'eliza_soho',
            isEmailVerified: true,
            balance: 40000,
            avatarColor: '#1E8449',
            hatStyle: 'crown',
            bio: 'Soho resident',
            currentZone: 'exterior',
            posX: 10,
            posY: 0,
            posZ: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(safe.username).toBe('eliza_soho');
        expect('passwordHash' in safe).toBe(false);
    });
});
