import { Component } from '@dolphjs/dolph';
import { RedisService } from '../../shared/services/redis.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { OtpService } from './otp.service';

@Component({
    controllers: [AccountController],
    services: [RedisService, OtpService, AccountService],
})
export class AccountComponent {}
