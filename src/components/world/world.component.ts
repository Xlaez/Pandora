import { Component } from '@dolphjs/dolph';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { RedisService } from '../../shared/services/redis.service';
import { PhoneService } from '../phone/phone.service';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';

@Component({
    controllers: [WorldController],
    services: [RedisService, RealtimeBusService, PhoneService, WorldService],
})
export class WorldComponent {}

