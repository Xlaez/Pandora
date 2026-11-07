import { Component } from '@dolphjs/dolph';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { PhoneService } from '../phone/phone.service';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Component({
    controllers: [StoresController],
    services: [RealtimeBusService, PhoneService, StoresService],
})
export class StoresComponent {}

