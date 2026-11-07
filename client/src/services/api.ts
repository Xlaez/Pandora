import {
    EconomyTransaction,
    InteriorTheme,
    InventoryItem,
    PandoraStore,
    PhoneMessage,
    PhoneNotification,
    Property,
    SafeAccount,
} from '../types/pandora';

interface DolphEnvelope<T> {
    success: boolean;
    status: number;
    message: string;
    data: T;
    error?: string;
}

const TOKEN_STORAGE_KEY = 'pandora_sovereign_jwt';

export const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
};

export const setStoredToken = (token: string | null): void => {
    try {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    } catch {
        return;
    }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/v1${path}`, {
        ...options,
        headers,
    });

    const json = (await res.json().catch(() => ({}))) as Partial<DolphEnvelope<T>>;

    if (!res.ok) {
        const msg = json.message || json.error || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return json.data as T;
}

export const pandoraApi = {
    register(email: string, password: string) {
        return request<{
            message: string;
            email: string;
            requiresVerification: boolean;
            devOtpCode: string;
            formattedSms: string;
            account: SafeAccount;
        }>('/account/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    verifyOtp(email: string, code: string) {
        return request<{
            message: string;
            token: string;
            needsUsername: boolean;
            account: SafeAccount;
        }>('/account/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
    },

    resendOtp(email: string) {
        return request<{
            message: string;
            email: string;
            devOtpCode: string;
            formattedSms: string;
        }>('/account/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    login(email: string, password: string) {
        return request<{
            message: string;
            requiresVerification: boolean;
            email?: string;
            devOtpCode?: string;
            formattedSms?: string;
            token: string | null;
            needsUsername: boolean;
            account: SafeAccount;
        }>('/account/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    setUsername(payload: { username: string; avatarColor?: string; hatStyle?: string; bio?: string }) {
        return request<{
            message: string;
            token: string;
            account: SafeAccount;
        }>('/account/username', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },

    updateProfile(payload: { avatarColor?: string; hatStyle?: string; bio?: string }) {
        return request<SafeAccount>('/account/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },

    getMe() {
        return request<SafeAccount>('/account/me');
    },

    listCitizens(search?: string) {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return request<SafeAccount[]>(`/account/citizens${query}`);
    },

    listProperties() {
        return request<Property[]>('/properties');
    },

    buyProperty(propertyId: string) {
        return request<{
            message: string;
            property: Property;
            balance: number;
            transaction: EconomyTransaction;
        }>(`/properties/${propertyId}/buy`, {
            method: 'POST',
        });
    },

    updatePropertySettings(
        propertyId: string,
        settings: { isLocked?: boolean; isForSale?: boolean; price?: number; interiorTheme?: InteriorTheme },
    ) {
        return request<Property>(`/properties/${propertyId}/settings`, {
            method: 'PATCH',
            body: JSON.stringify(settings),
        });
    },

    enterProperty(propertyId: string) {
        return request<{
            message: string;
            zoneId: string;
            property: Property;
        }>(`/properties/${propertyId}/enter`, {
            method: 'POST',
        });
    },

    exitToStreet() {
        return request<{
            message: string;
            zoneId: string;
        }>('/properties/exit', {
            method: 'POST',
        });
    },

    getLedger() {
        return request<{
            balance: number;
            stipendCooldownSeconds: number;
            stipendAmount: number;
            transactions: EconomyTransaction[];
        }>('/economy/ledger');
    },

    transferMoney(recipientUsername: string, amount: number, note?: string) {
        return request<{
            message: string;
            transaction: EconomyTransaction;
            balance: number;
        }>('/economy/transfer', {
            method: 'POST',
            body: JSON.stringify({
                recipientUsername,
                amount,
                note,
                idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            }),
        });
    },

    claimStipend(activity?: string) {
        return request<{
            message: string;
            balance: number;
            transaction: EconomyTransaction;
            cooldownSeconds: number;
        }>('/economy/stipend', {
            method: 'POST',
            body: JSON.stringify({ activity }),
        });
    },

    listStores() {
        return request<PandoraStore[]>('/stores');
    },

    enterStore(slug: string) {
        return request<{
            message: string;
            zoneId: string;
            store: PandoraStore;
        }>(`/stores/${slug}/enter`, {
            method: 'POST',
        });
    },

    purchaseStoreItem(slug: string, sku: string, quantity = 1) {
        return request<{
            message: string;
            item: InventoryItem;
            balance: number;
            avatarColor: string;
            hatStyle: string;
            transaction: EconomyTransaction;
        }>(`/stores/${slug}/purchase`, {
            method: 'POST',
            body: JSON.stringify({ sku, quantity }),
        });
    },

    getInventory() {
        return request<InventoryItem[]>('/stores/inventory');
    },

    equipItem(inventoryId: string) {
        return request<{
            item: InventoryItem;
            avatarColor: string;
            hatStyle: string;
        }>(`/stores/inventory/${inventoryId}/equip`, {
            method: 'PATCH',
        });
    },

    sendSms(recipientUsername: string, content: string) {
        return request<PhoneMessage>('/phone/messages', {
            method: 'POST',
            body: JSON.stringify({ recipientUsername, content }),
        });
    },

    getRecentMessages() {
        return request<PhoneMessage[]>('/phone/messages');
    },

    getConversation(username: string) {
        return request<PhoneMessage[]>(`/phone/messages/${encodeURIComponent(username)}`);
    },

    getNotifications() {
        return request<PhoneNotification[]>('/phone/notifications');
    },

    markNotificationsRead() {
        return request<{ updated: boolean }>('/phone/notifications/read', {
            method: 'PATCH',
        });
    },
};

