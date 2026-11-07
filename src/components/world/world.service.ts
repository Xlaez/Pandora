import {
    BadRequestException,
    ConflictException,
    DService,
    ForbiddenException,
    getDataSource,
    NotFoundException,
} from '@dolphjs/dolph';
import { randomUUID } from 'crypto';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { RedisService } from '../../shared/services/redis.service';
import { Account } from '../account/account.entity';
import { EconomyTransaction } from '../economy/transaction.entity';
import { PhoneService } from '../phone/phone.service';
import { Property } from './property.entity';
import { UpdatePropertySettingsDto } from './world.dto';
import { PANDORA_INITIAL_PROPERTIES } from './world.seed';

@DService()
export class WorldService {
    private seeded = false;

    constructor(
        private readonly redisService: RedisService,
        private readonly realtimeBus: RealtimeBusService,
        private readonly phoneService: PhoneService,
    ) {}

    private get propertyRepo() {
        return getDataSource().getRepository(Property);
    }

    private get accountRepo() {
        return getDataSource().getRepository(Account);
    }

    async ensureSeeded(): Promise<void> {
        if (this.seeded) return;

        for (const seed of PANDORA_INITIAL_PROPERTIES) {
            const exists = await this.propertyRepo.findOne({ where: { slug: seed.slug } });
            if (!exists) {
                const created = this.propertyRepo.create({
                    ...seed,
                    isForSale: true,
                    isLocked: false,
                    ownerId: null,
                    ownerUsername: null,
                });
                await this.propertyRepo.save(created);
            }
        }
        this.seeded = true;
    }

    async listProperties(): Promise<Property[]> {
        await this.ensureSeeded();
        return this.propertyRepo.find({
            order: { price: 'ASC' },
        });
    }

    async getProperty(idOrSlug: string): Promise<Property> {
        await this.ensureSeeded();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        const prop = await this.propertyRepo.findOne({
            where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
        });

        if (!prop) {
            throw new NotFoundException('Property not found in Pandora');
        }
        return prop;
    }

    async buyProperty(buyerAccountId: string, propertyId: string) {
        await this.ensureSeeded();

        const lockToken = await this.redisService.acquireLock(`property:${propertyId}`, 10);
        if (!lockToken) {
            throw new ConflictException('Another transaction is currently processing for this property');
        }

        try {
            const dataSource = getDataSource();
            const outcome = await dataSource.transaction(async (manager) => {
                const property = await manager
                    .createQueryBuilder(Property, 'prop')
                    .setLock('pessimistic_write')
                    .where('prop.id = :id', { id: propertyId })
                    .getOne();

                if (!property) {
                    throw new NotFoundException('Property not found');
                }

                if (property.ownerId === buyerAccountId) {
                    throw new BadRequestException('You already own this house');
                }

                if (!property.isForSale) {
                    throw new BadRequestException('This property is not currently listed for sale');
                }

                const buyer = await manager
                    .createQueryBuilder(Account, 'acc')
                    .setLock('pessimistic_write')
                    .where('acc.id = :id', { id: buyerAccountId })
                    .getOne();

                if (!buyer || !buyer.username) {
                    throw new BadRequestException('Set your Pandora username before purchasing property');
                }

                if (buyer.balance < property.price) {
                    throw new BadRequestException(
                        `Insufficient funds to purchase ${property.name} (Price: £${property.price.toLocaleString()}, Your Balance: £${buyer.balance.toLocaleString()})`,
                    );
                }

                const previousOwnerId = property.ownerId;
                const previousOwnerUsername = property.ownerUsername;
                const salePrice = property.price;
                let previousOwnerNewBalance: number | null = null;

                buyer.balance -= salePrice;
                await manager.save(Account, buyer);

                if (previousOwnerId) {
                    const prevOwner = await manager
                        .createQueryBuilder(Account, 'prev')
                        .setLock('pessimistic_write')
                        .where('prev.id = :id', { id: previousOwnerId })
                        .getOne();

                    if (prevOwner) {
                        prevOwner.balance += salePrice;
                        await manager.save(Account, prevOwner);
                        previousOwnerNewBalance = prevOwner.balance;
                    }
                }

                property.ownerId = buyer.id;
                property.ownerUsername = buyer.username;
                property.isForSale = false;
                property.isLocked = false;

                const savedProperty = await manager.save(Property, property);

                const txRecord = manager.create(EconomyTransaction, {
                    senderId: buyer.id,
                    senderUsername: buyer.username,
                    recipientId: previousOwnerId,
                    recipientUsername: previousOwnerUsername ?? 'crown_estate',
                    amount: salePrice,
                    category: 'house_purchase',
                    note: `Purchased ${savedProperty.name} (${savedProperty.district})`,
                    reference: `deed:${randomUUID()}`,
                });
                const savedTx = await manager.save(EconomyTransaction, txRecord);

                return {
                    savedProperty,
                    savedTx,
                    buyerBalance: buyer.balance,
                    buyerUsername: buyer.username,
                    previousOwnerId,
                    previousOwnerNewBalance,
                    salePrice,
                };
            });

            this.realtimeBus.emitToAll('property:updated', outcome.savedProperty);

            this.realtimeBus.emitToUser(buyerAccountId, 'wallet:updated', {
                balance: outcome.buyerBalance,
                transaction: outcome.savedTx,
            });

            await this.phoneService.pushNotification({
                accountId: buyerAccountId,
                type: 'house_purchased',
                title: `Deed Acquired: ${outcome.savedProperty.name}`,
                body: `You are now the proud owner of ${outcome.savedProperty.name} in ${outcome.savedProperty.district}!`,
                amount: -outcome.salePrice,
            });

            if (outcome.previousOwnerId && outcome.previousOwnerNewBalance !== null) {
                this.realtimeBus.emitToUser(outcome.previousOwnerId, 'wallet:updated', {
                    balance: outcome.previousOwnerNewBalance,
                    transaction: outcome.savedTx,
                });

                await this.phoneService.pushNotification({
                    accountId: outcome.previousOwnerId,
                    type: 'house_sold',
                    title: `Property Sold: ${outcome.savedProperty.name}`,
                    body: `@${outcome.buyerUsername} purchased your property for £${outcome.salePrice.toLocaleString()}`,
                    amount: outcome.salePrice,
                });
            }

            return {
                message: `Congratulations! You now own ${outcome.savedProperty.name}`,
                property: outcome.savedProperty,
                balance: outcome.buyerBalance,
                transaction: outcome.savedTx,
            };
        } finally {
            await this.redisService.releaseLock(`property:${propertyId}`, lockToken);
        }
    }

    async updatePropertySettings(accountId: string, propertyId: string, dto: UpdatePropertySettingsDto): Promise<Property> {
        const property = await this.getProperty(propertyId);

        if (property.ownerId !== accountId) {
            throw new ForbiddenException('Only the deed holder of this house can modify its settings');
        }

        if (dto.isLocked !== undefined) {
            property.isLocked = dto.isLocked;
        }
        if (dto.isForSale !== undefined) {
            property.isForSale = dto.isForSale;
        }
        if (dto.price !== undefined) {
            property.price = dto.price;
        }
        if (dto.interiorTheme !== undefined) {
            property.interiorTheme = dto.interiorTheme;
        }

        const saved = await this.propertyRepo.save(property);
        this.realtimeBus.emitToAll('property:updated', saved);
        return saved;
    }

    async enterProperty(accountId: string, propertyId: string) {
        const property = await this.getProperty(propertyId);
        const account = await this.accountRepo.findOne({ where: { id: accountId } });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        if (property.isLocked && property.ownerId !== accountId) {
            throw new ForbiddenException(`${property.name} is locked by @${property.ownerUsername ?? 'owner'}`);
        }

        const zoneId = `house:${property.id}`;
        account.currentZone = zoneId;
        await this.accountRepo.save(account);

        if (property.ownerId && property.ownerId !== accountId && account.username) {
            await this.phoneService.pushNotification({
                accountId: property.ownerId,
                type: 'visitor_entered',
                title: `House Visitor at ${property.name}`,
                body: `@${account.username} just stepped inside ${property.name}`,
            });
        }

        return {
            message: `Entered ${property.name}`,
            zoneId,
            property,
        };
    }

    async exitToStreet(accountId: string) {
        const account = await this.accountRepo.findOne({ where: { id: accountId } });
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        account.currentZone = 'exterior';
        await this.accountRepo.save(account);

        return {
            message: 'Stepped out onto the streets of Pandora',
            zoneId: 'exterior',
        };
    }
}

