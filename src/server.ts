import { DolphFactory, socketJwtAuth } from '@dolphjs/dolph';
import { AccountComponent } from './components/account/account.component';
import { Account } from './components/account/account.entity';
import { OtpCode } from './components/account/otp-code.entity';
import { EconomyComponent } from './components/economy/economy.component';
import { EconomyTransaction } from './components/economy/transaction.entity';
import { PhoneMessage } from './components/phone/phone-message.entity';
import { PhoneNotification } from './components/phone/phone-notification.entity';
import { PhoneComponent } from './components/phone/phone.component';
import { PandoraSocketComponent } from './components/realtime/pandora.socket';
import { InventoryItem } from './components/stores/inventory-item.entity';
import { StoresComponent } from './components/stores/stores.component';
import { Property } from './components/world/property.entity';
import { WorldComponent } from './components/world/world.component';
import { env } from './shared/configs/env.config';

export const PANDORA_ENTITIES = [
    Account,
    OtpCode,
    Property,
    EconomyTransaction,
    InventoryItem,
    PhoneMessage,
    PhoneNotification,
];

interface InternalDolphConfigs {
    configs?: {
        database?: {
            typeorm?: {
                options?: {
                    entities?: unknown[];
                };
            };
        };
    };
}

export const createDolphApp = () => {
    const dolph = new DolphFactory(
        [AccountComponent, WorldComponent, EconomyComponent, StoresComponent, PhoneComponent],
        {
            sockets: {
                component: new PandoraSocketComponent(),
                auth: socketJwtAuth(env.jwt.secret),
                options: {
                    cors: {
                        origin: '*',
                        methods: ['GET', 'POST'],
                    },
                },
            },
        },
    );

    dolph.engine();
    const internal = dolph as unknown as InternalDolphConfigs;
    if (internal.configs?.database?.typeorm?.options) {
        internal.configs.database.typeorm.options.entities = PANDORA_ENTITIES;
    }

    return dolph;
};

if (require.main === module) {
    const dolph = createDolphApp();
    dolph.start();
}
