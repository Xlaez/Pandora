import { DBody, DPayload, Get, Post, Route, Shield } from '@dolphjs/dolph';
import { PandoraJwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { authShield } from '../../shared/shields/auth.shield';
import { ClaimStipendDto, TransferMoneyDto } from './economy.dto';
import { EconomyService } from './economy.service';

@Shield(authShield)
@Route('economy')
export class EconomyController {
    constructor(private readonly economyService: EconomyService) {}

    @Get('ledger')
    async getLedger(@DPayload() payload: PandoraJwtPayload) {
        return this.economyService.getLedger(payload.sub);
    }

    @Post('transfer')
    async transfer(@DPayload() payload: PandoraJwtPayload, @DBody(TransferMoneyDto) body: TransferMoneyDto) {
        return this.economyService.transferMoney(payload.sub, body);
    }

    @Post('stipend')
    async claimStipend(@DPayload() payload: PandoraJwtPayload, @DBody(ClaimStipendDto) body: ClaimStipendDto) {
        return this.economyService.claimStipend(payload.sub, body);
    }
}

