import {
    DBody,
    DParam,
    DPayload,
    Get,
    Patch,
    Post,
    Route,
    Shield,
    UnShield,
} from '@dolphjs/dolph';
import { PandoraJwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { authShield } from '../../shared/shields/auth.shield';
import { PropertyIdParamDto, UpdatePropertySettingsDto } from './world.dto';
import { WorldService } from './world.service';

@Shield(authShield)
@Route('properties')
export class WorldController {
    constructor(private readonly worldService: WorldService) {}

    @Get()
    @UnShield(authShield)
    async listProperties() {
        return this.worldService.listProperties();
    }

    @Get(':id')
    @UnShield(authShield)
    async getProperty(@DParam(PropertyIdParamDto) params: PropertyIdParamDto) {
        return this.worldService.getProperty(params.id);
    }

    @Post(':id/buy')
    async buyProperty(@DPayload() payload: PandoraJwtPayload, @DParam(PropertyIdParamDto) params: PropertyIdParamDto) {
        return this.worldService.buyProperty(payload.sub, params.id);
    }

    @Patch(':id/settings')
    async updateSettings(
        @DPayload() payload: PandoraJwtPayload,
        @DParam(PropertyIdParamDto) params: PropertyIdParamDto,
        @DBody(UpdatePropertySettingsDto) body: UpdatePropertySettingsDto,
    ) {
        return this.worldService.updatePropertySettings(payload.sub, params.id, body);
    }

    @Post(':id/enter')
    async enterProperty(@DPayload() payload: PandoraJwtPayload, @DParam(PropertyIdParamDto) params: PropertyIdParamDto) {
        return this.worldService.enterProperty(payload.sub, params.id);
    }

    @Post('exit')
    async exitProperty(@DPayload() payload: PandoraJwtPayload) {
        return this.worldService.exitToStreet(payload.sub);
    }
}

