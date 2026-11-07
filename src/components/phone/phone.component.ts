import { Component } from '@dolphjs/dolph';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { PhoneController } from './phone.controller';
import { PhoneService } from './phone.service';

@Component({
    controllers: [PhoneController],
    services: [RealtimeBusService, PhoneService],
})
export class PhoneComponent {}

