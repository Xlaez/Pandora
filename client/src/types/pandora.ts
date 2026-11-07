export type RoofStyle = 'mansard' | 'gable' | 'flat_parapet' | 'townhouse';
export type InteriorTheme = 'georgian_velvet' | 'shoreditch_industrial' | 'mayfair_marble' | 'chelsea_botanical';
export type StoreItemCategory = 'apparel' | 'gadget' | 'refreshment' | 'decor';
export type LedgerCategory = 'p2p_transfer' | 'house_purchase' | 'store_purchase' | 'city_stipend';

export interface SafeAccount {
    id: string;
    email: string;
    username: string | null;
    isEmailVerified: boolean;
    balance: number;
    avatarColor: string;
    hatStyle: string;
    bio: string;
    currentZone: string;
    posX: number;
    posY: number;
    posZ: number;
    createdAt: string;
}

export interface Property {
    id: string;
    slug: string;
    name: string;
    district: string;
    address: string;
    description: string;
    price: number;
    isForSale: boolean;
    isLocked: boolean;
    ownerId: string | null;
    ownerUsername: string | null;
    posX: number;
    posZ: number;
    rotationY: number;
    width: number;
    depth: number;
    floors: number;
    facadeColor: string;
    trimColor: string;
    roofStyle: RoofStyle;
    interiorTheme: InteriorTheme;
}

export interface StoreCatalogItem {
    sku: string;
    name: string;
    description: string;
    price: number;
    category: StoreItemCategory;
    icon: string;
    grantsHatStyle?: string;
    grantsAvatarColor?: string;
}

export interface PandoraStore {
    slug: string;
    name: string;
    subtitle: string;
    district: string;
    address: string;
    posX: number;
    posZ: number;
    rotationY: number;
    facadeColor: string;
    accentColor: string;
    signText: string;
    items: StoreCatalogItem[];
}

export interface InventoryItem {
    id: string;
    accountId: string;
    itemSku: string;
    itemName: string;
    storeSlug: string;
    category: StoreItemCategory;
    icon: string;
    pricePaid: number;
    quantity: number;
    isEquipped: boolean;
    createdAt: string;
}

export interface EconomyTransaction {
    id: string;
    senderId: string | null;
    senderUsername: string | null;
    recipientId: string | null;
    recipientUsername: string | null;
    amount: number;
    category: LedgerCategory;
    note: string;
    reference: string;
    createdAt: string;
}

export interface PhoneMessage {
    id: string;
    senderId: string;
    senderUsername: string;
    recipientId: string;
    recipientUsername: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

export interface PhoneNotification {
    id: string;
    accountId?: string;
    type: string;
    title: string;
    body: string;
    amount?: number | null;
    isRead?: boolean;
    createdAt: string;
}

export interface PlayerSpatialState {
    accountId: string;
    username: string;
    avatarColor: string;
    hatStyle: string;
    x: number;
    y: number;
    z: number;
    rotationY: number;
    zoneId: string;
    updatedAt: number;
}

export interface OnlineCitizenSummary {
    accountId: string;
    username: string;
    avatarColor: string;
    hatStyle: string;
    zoneId: string;
}

export interface PublicChatMessage {
    id: string;
    accountId: string;
    username: string;
    avatarColor: string;
    zoneId: string;
    message: string;
    createdAt: string;
}

export interface NearbyPortal {
    kind: 'house' | 'store';
    id: string;
    name: string;
    subtitle: string;
    price?: number;
    isForSale?: boolean;
    isLocked?: boolean;
    ownerUsername?: string | null;
    ownerId?: string | null;
}

export type PhoneAppId = 'home' | 'bank' | 'realty' | 'sms' | 'directory' | 'wardrobe' | 'map';

