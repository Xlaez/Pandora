import {
    DBody,
    DParam,
    DPayload,
    Get,
    Patch,
    Post,
    Route,
    Shield,
} from '@dolphjs/dolph';
import { PandoraJwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { authShield } from '../../shared/shields/auth.shield';
import { SendSmsDto, ThreadParamDto } from './phone.dto';
import { PhoneService } from './phone.service';

@Shield(authShield)
@Route('phone')
export class PhoneController {
    constructor(private readonly phoneService: PhoneService) {}

    @Post('messages')
    async sendSms(@DPayload() payload: PandoraJwtPayload, @DBody(SendSmsDto) body: SendSmsDto) {
        return this.phoneService.sendSms(payload.sub, body);
    }

    @Get('messages')
    async getRecentMessages(@DPayload() payload: PandoraJwtPayload) {
        return this.phoneService.getRecentMessages(payload.sub);
    }

    @Get('messages/:username')
    async getConversation(@DPayload() payload: PandoraJwtPayload, @DParam(ThreadParamDto) params: ThreadParamDto) {
        return this.phoneService.getConversation(payload.sub, params.username);
    }

    @Get('notifications')
    async getNotifications(@DPayload() payload: PandoraJwtPayload) {
        return this.phoneService.getNotifications(payload.sub);
    }

    @Patch('notifications/read')
    async markNotificationsRead(@DPayload() payload: PandoraJwtPayload) {
        return this.phoneService.markNotificationsRead(payload.sub);
    }
}

