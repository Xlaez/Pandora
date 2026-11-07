import {
    BadRequestException,
    DService,
    ForbiddenException,
    getDataSource,
    NotFoundException,
} from '@dolphjs/dolph';
import { randomUUID } from 'crypto';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { Account } from '../account/account.entity';
import { EconomyTransaction } from '../economy/transaction.entity';
import { PhoneService } from '../phone/phone.service';
import { InventoryItem } from './inventory-item.entity';
import { PANDORA_STORES, PandoraStoreDefinition, StoreCatalogItem } from './stores.catalog';
import { PurchaseStoreItemDto } from './stores.dto';

@DService()
export class StoresService {
    constructor(
        private readonly realtimeBus: RealtimeBusService,
        private readonly phoneService: PhoneService,
    ) {}

    private get inventoryRepo() {
        return getDataSource().getRepository(InventoryItem);
    }

    private get accountRepo() {
        return getDataSource().getRepository(Account);
    }

    listStores(): PandoraStoreDefinition[] {
        return PANDORA_STORES;
    }

    getStore(slug: string): PandoraStoreDefinition {
        const store = PANDORA_STORES.find((s) => s.slug === slug);
        if (!store) {
            throw new NotFoundException(`Store '${slug}' not found in Pandora`);
        }
        return store;
    }

    findCatalogItem(sku: string): { store: PandoraStoreDefinition; item: StoreCatalogItem } | null {
        for (const store of PANDORA_STORES) {
            const item = store.items.find((i) => i.sku === sku);
            if (item) return { store, item };
        }
        return null;
    }

    async enterStore(accountId: string, slug: string) {
        const store = this.getStore(slug);
        const account = await this.accountRepo.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const zoneId = `store:${store.slug}`;
        account.currentZone = zoneId;
        await this.accountRepo.save(account);

        return {
            message: `Welcome to ${store.name}`,
            zoneId,
            store,
        };
    }

    async purchaseItem(accountId: string, storeSlug: string, dto: PurchaseStoreItemDto) {
        const store = this.getStore(storeSlug);
        const catalogItem = store.items.find((i) => i.sku === dto.sku);
        if (!catalogItem) {
            throw new NotFoundException(`Item '${dto.sku}' is not sold at ${store.name}`);
        }

        const quantity = dto.quantity ?? 1;
        const totalCost = catalogItem.price * quantity;

        const dataSource = getDataSource();
        const outcome = await dataSource.transaction(async (manager) => {
            const buyer = await manager
                .createQueryBuilder(Account, 'acc')
                .setLock('pessimistic_write')
                .where('acc.id = :id', { id: accountId })
                .getOne();

            if (!buyer) {
                throw new NotFoundException('Account not found');
            }

            if (buyer.balance < totalCost) {
                throw new BadRequestException(
                    `Insufficient funds at ${store.name} (Cost: £${totalCost.toLocaleString()}, Balance: £${buyer.balance.toLocaleString()})`,
                );
            }

            buyer.balance -= totalCost;
            if (catalogItem.grantsHatStyle) {
                buyer.hatStyle = catalogItem.grantsHatStyle;
            }
            if (catalogItem.grantsAvatarColor) {
                buyer.avatarColor = catalogItem.grantsAvatarColor;
            }
            await manager.save(Account, buyer);

            let invItem = await manager.findOne(InventoryItem, {
                where: { accountId: buyer.id, itemSku: catalogItem.sku },
            });

            if (invItem) {
                invItem.quantity += quantity;
                invItem.isEquipped = Boolean(catalogItem.grantsHatStyle || catalogItem.grantsAvatarColor);
                invItem = await manager.save(InventoryItem, invItem);
            } else {
                const created = manager.create(InventoryItem, {
                    accountId: buyer.id,
                    itemSku: catalogItem.sku,
                    itemName: catalogItem.name,
                    storeSlug: store.slug,
                    category: catalogItem.category,
                    icon: catalogItem.icon,
                    pricePaid: catalogItem.price,
                    quantity,
                    isEquipped: Boolean(catalogItem.grantsHatStyle || catalogItem.grantsAvatarColor),
                });
                invItem = await manager.save(InventoryItem, created);
            }

            const tx = manager.create(EconomyTransaction, {
                senderId: buyer.id,
                senderUsername: buyer.username ?? buyer.email,
                recipientId: null,
                recipientUsername: store.slug,
                amount: totalCost,
                category: 'store_purchase',
                note: `${quantity}x ${catalogItem.name} at ${store.name}`,
                reference: `store:${randomUUID()}`,
            });
            const savedTx = await manager.save(EconomyTransaction, tx);

            return {
                buyer,
                invItem,
                savedTx,
            };
        });

        this.realtimeBus.emitToUser(accountId, 'wallet:updated', {
            balance: outcome.buyer.balance,
            transaction: outcome.savedTx,
        });

        await this.phoneService.pushNotification({
            accountId,
            type: 'store_purchase',
            title: `Receipt: ${store.name}`,
            body: `Purchased ${quantity}x ${catalogItem.name} for £${totalCost.toLocaleString()}`,
            amount: -totalCost,
        });

        return {
            message: `Purchased ${catalogItem.name} from ${store.name}`,
            item: outcome.invItem,
            balance: outcome.buyer.balance,
            avatarColor: outcome.buyer.avatarColor,
            hatStyle: outcome.buyer.hatStyle,
            transaction: outcome.savedTx,
        };
    }

    async getInventory(accountId: string): Promise<InventoryItem[]> {
        return this.inventoryRepo.find({
            where: { accountId },
            order: { updatedAt: 'DESC' },
        });
    }

    async equipItem(accountId: string, inventoryId: string) {
        const item = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        if (item.accountId !== accountId) {
            throw new ForbiddenException('You do not own this item');
        }

        const found = this.findCatalogItem(item.itemSku);
        const account = await this.accountRepo.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        item.isEquipped = !item.isEquipped;
        await this.inventoryRepo.save(item);

        if (item.isEquipped && found) {
            if (found.item.grantsHatStyle) {
                account.hatStyle = found.item.grantsHatStyle;
            }
            if (found.item.grantsAvatarColor) {
                account.avatarColor = found.item.grantsAvatarColor;
            }
            await this.accountRepo.save(account);
        }

        return {
            item,
            avatarColor: account.avatarColor,
            hatStyle: account.hatStyle,
        };
    }
}

