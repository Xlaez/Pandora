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
import { InventoryIdParamDto, PurchaseStoreItemDto, StoreSlugParamDto } from './stores.dto';
import { StoresService } from './stores.service';

@Shield(authShield)
@Route('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) {}

    @Get()
    @UnShield(authShield)
    listStores() {
        return this.storesService.listStores();
    }

    @Get('inventory')
    async getInventory(@DPayload() payload: PandoraJwtPayload) {
        return this.storesService.getInventory(payload.sub);
    }

    @Patch('inventory/:id/equip')
    async equipItem(@DPayload() payload: PandoraJwtPayload, @DParam(InventoryIdParamDto) params: InventoryIdParamDto) {
        return this.storesService.equipItem(payload.sub, params.id);
    }

    @Get(':slug')
    @UnShield(authShield)
    getStore(@DParam(StoreSlugParamDto) params: StoreSlugParamDto) {
        return this.storesService.getStore(params.slug);
    }

    @Post(':slug/enter')
    async enterStore(@DPayload() payload: PandoraJwtPayload, @DParam(StoreSlugParamDto) params: StoreSlugParamDto) {
        return this.storesService.enterStore(payload.sub, params.slug);
    }

    @Post(':slug/purchase')
    async purchaseItem(
        @DPayload() payload: PandoraJwtPayload,
        @DParam(StoreSlugParamDto) params: StoreSlugParamDto,
        @DBody(PurchaseStoreItemDto) body: PurchaseStoreItemDto,
    ) {
        return this.storesService.purchaseItem(payload.sub, params.slug, body);
    }
}

