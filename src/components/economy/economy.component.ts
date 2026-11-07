import { Component } from '@dolphjs/dolph';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { RedisService } from '../../shared/services/redis.service';
import { PhoneService } from '../phone/phone.service';
import { EconomyController } from './economy.controller';
import { EconomyService } from './economy.service';

@Component({
    controllers: [EconomyController],
    services: [RedisService, RealtimeBusService, PhoneService, EconomyService],
})
export class EconomyComponent {}

