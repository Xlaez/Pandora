import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getStoredToken, pandoraApi, setStoredToken } from '../services/api';
import {
    EconomyTransaction,
    InteriorTheme,
    InventoryItem,
    NearbyPortal,
    OnlineCitizenSummary,
    PandoraStore,
    PhoneAppId,
    PhoneMessage,
    PhoneNotification,
    PlayerSpatialState,
    Property,
    PublicChatMessage,
    SafeAccount,
} from '../types/pandora';

export interface ToastAlert {
    id: string;
    title: string;
    body: string;
    variant: 'gold' | 'emerald' | 'crimson' | 'info';
}

interface PandoraState {
    token: string | null;
    account: SafeAccount | null;
    authStep: 'auth' | 'otp' | 'username' | 'ready';
    pendingEmail: string;
    devOtpCode: string | null;
    formattedSms: string | null;
    isLoadingAuth: boolean;
    authError: string | null;

    properties: Property[];
    stores: PandoraStore[];
    inventory: InventoryItem[];
    transactions: EconomyTransaction[];
    stipendCooldown: number;
    citizens: SafeAccount[];
    smsMessages: PhoneMessage[];
    notifications: PhoneNotification[];

    currentZone: string;
    localPosition: [number, number, number];
    localRotationY: number;
    nearbyPortal: NearbyPortal | null;
    timeOfDay: 'day' | 'dusk' | 'night';

    remotePlayers: Record<string, PlayerSpatialState>;
    onlineCitizens: OnlineCitizenSummary[];
    onlineCount: number;
    chatMessages: PublicChatMessage[];
    headBubbles: Record<string, { text: string; expiresAt: number }>;

    isPhoneOpen: boolean;
    activePhoneApp: PhoneAppId;
    selectedSmsUsername: string | null;
    selectedPropertyId: string | null;
    toasts: ToastAlert[];

    socket: Socket | null;

    pushToast: (title: string, body: string, variant?: ToastAlert['variant']) => void;
    dismissToast: (id: string) => void;
    setTimeOfDay: (mode: 'day' | 'dusk' | 'night') => void;
    setPhoneOpen: (open: boolean, app?: PhoneAppId) => void;
    setActivePhoneApp: (app: PhoneAppId) => void;
    setSelectedSmsUsername: (username: string | null) => void;
    setSelectedPropertyId: (id: string | null) => void;
    setNearbyPortal: (portal: NearbyPortal | null) => void;

    bootstrapSession: () => Promise<void>;
    registerAccount: (email: string, password: string) => Promise<void>;
    loginAccount: (email: string, password: string) => Promise<void>;
    verifyOtpCode: (code: string) => Promise<void>;
    resendOtpCode: () => Promise<void>;
    claimUsername: (username: string, avatarColor: string, hatStyle: string, bio: string) => Promise<void>;
    logout: () => void;

    hydrateCityData: () => Promise<void>;
    connectSocket: () => void;
    disconnectSocket: () => void;

    updateLocalTransform: (x: number, y: number, z: number, rotationY: number) => void;
    teleportToExterior: (x: number, z: number) => Promise<void>;
    enterHouse: (propertyId: string) => Promise<void>;
    enterStoreBuilding: (storeSlug: string) => Promise<void>;
    exitBuildingToStreet: () => Promise<void>;

    buyHouse: (propertyId: string) => Promise<void>;
    updateHouseSettings: (
        propertyId: string,
        settings: { isLocked?: boolean; isForSale?: boolean; price?: number; interiorTheme?: InteriorTheme },
    ) => Promise<void>;

    sendMoney: (recipientUsername: string, amount: number, note?: string) => Promise<void>;
    claimCivicStipend: (activity?: string) => Promise<void>;
    buyStoreItem: (storeSlug: string, sku: string) => Promise<void>;
    toggleEquipItem: (inventoryId: string) => Promise<void>;

    sendSmsMessage: (recipientUsername: string, content: string) => Promise<void>;
    sendPublicChat: (message: string) => void;
    markAllNotificationsRead: () => Promise<void>;
}

let lastMoveEmitTime = 0;

export const usePandoraStore = create<PandoraState>((set, get) => ({
    token: getStoredToken(),
    account: null,
    authStep: 'auth',
    pendingEmail: '',
    devOtpCode: null,
    formattedSms: null,
    isLoadingAuth: false,
    authError: null,

    properties: [],
    stores: [],
    inventory: [],
    transactions: [],
    stipendCooldown: 0,
    citizens: [],
    smsMessages: [],
    notifications: [],

    currentZone: 'exterior',
    localPosition: [0, 0, 22],
    localRotationY: 0,
    nearbyPortal: null,
    timeOfDay: 'dusk',

    remotePlayers: {},
    onlineCitizens: [],
    onlineCount: 1,
    chatMessages: [],
    headBubbles: {},

    isPhoneOpen: false,
    activePhoneApp: 'home',
    selectedSmsUsername: null,
    selectedPropertyId: null,
    toasts: [],

    socket: null,

    pushToast: (title, body, variant = 'gold') => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
            toasts: [...state.toasts.slice(-4), { id, title, body, variant }],
        }));
        setTimeout(() => {
            get().dismissToast(id);
        }, 5500);
    },

    dismissToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },

    setTimeOfDay: (mode) => set({ timeOfDay: mode }),

    setPhoneOpen: (open, app) => {
        set((state) => ({
            isPhoneOpen: open,
            activePhoneApp: app ?? state.activePhoneApp,
        }));
    },

    setActivePhoneApp: (app) => set({ activePhoneApp: app }),

    setSelectedSmsUsername: (username) => set({ selectedSmsUsername: username }),

    setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),

    setNearbyPortal: (portal) => set({ nearbyPortal: portal }),

    bootstrapSession: async () => {
        const token = getStoredToken();
        if (!token) {
            set({ authStep: 'auth', token: null, account: null });
            return;
        }

        set({ isLoadingAuth: true, authError: null });
        try {
            const me = await pandoraApi.getMe();
            if (!me.isEmailVerified) {
                set({
                    account: me,
                    pendingEmail: me.email,
                    authStep: 'otp',
                    isLoadingAuth: false,
                });
                return;
            }
            if (!me.username) {
                set({
                    account: me,
                    authStep: 'username',
                    isLoadingAuth: false,
                });
                return;
            }

            set({
                account: me,
                currentZone: me.currentZone || 'exterior',
                localPosition: [me.posX || 0, 0, me.posZ || 22],
                authStep: 'ready',
                isLoadingAuth: false,
            });

            await get().hydrateCityData();
            get().connectSocket();
        } catch {
            setStoredToken(null);
            set({
                token: null,
                account: null,
                authStep: 'auth',
                isLoadingAuth: false,
            });
        }
    },

    registerAccount: async (email, password) => {
        set({ isLoadingAuth: true, authError: null });
        try {
            const res = await pandoraApi.register(email, password);
            set({
                pendingEmail: res.email,
                devOtpCode: res.devOtpCode,
                formattedSms: res.formattedSms,
                account: res.account,
                authStep: 'otp',
                isLoadingAuth: false,
            });
            get().pushToast('OTP Dispatched', `6-digit code sent to ${res.email}`, 'gold');
        } catch (err) {
            set({
                authError: err instanceof Error ? err.message : 'Registration failed',
                isLoadingAuth: false,
            });
        }
    },

    loginAccount: async (email, password) => {
        set({ isLoadingAuth: true, authError: null });
        try {
            const res = await pandoraApi.login(email, password);
            if (res.requiresVerification || !res.token) {
                set({
                    pendingEmail: res.email || email,
                    devOtpCode: res.devOtpCode ?? null,
                    formattedSms: res.formattedSms ?? null,
                    account: res.account,
                    authStep: 'otp',
                    isLoadingAuth: false,
                });
                return;
            }

            setStoredToken(res.token);
            set({
                token: res.token,
                account: res.account,
                currentZone: res.account.currentZone || 'exterior',
                localPosition: [res.account.posX || 0, 0, res.account.posZ || 22],
                authStep: res.needsUsername ? 'username' : 'ready',
                isLoadingAuth: false,
            });

            if (!res.needsUsername) {
                await get().hydrateCityData();
                get().connectSocket();
            }
        } catch (err) {
            set({
                authError: err instanceof Error ? err.message : 'Login failed',
                isLoadingAuth: false,
            });
        }
    },

    verifyOtpCode: async (code) => {
        const { pendingEmail } = get();
        set({ isLoadingAuth: true, authError: null });
        try {
            const res = await pandoraApi.verifyOtp(pendingEmail, code);
            setStoredToken(res.token);
            set({
                token: res.token,
                account: res.account,
                devOtpCode: null,
                authStep: res.needsUsername ? 'username' : 'ready',
                isLoadingAuth: false,
            });

            if (!res.needsUsername) {
                await get().hydrateCityData();
                get().connectSocket();
            }
        } catch (err) {
            set({
                authError: err instanceof Error ? err.message : 'Invalid verification code',
                isLoadingAuth: false,
            });
        }
    },

    resendOtpCode: async () => {
        const { pendingEmail } = get();
        set({ isLoadingAuth: true, authError: null });
        try {
            const res = await pandoraApi.resendOtp(pendingEmail);
            set({
                devOtpCode: res.devOtpCode,
                formattedSms: res.formattedSms,
                isLoadingAuth: false,
            });
            get().pushToast('New OTP Issued', `Fresh 6-digit code sent to ${pendingEmail}`, 'gold');
        } catch (err) {
            set({
                authError: err instanceof Error ? err.message : 'Could not resend OTP',
                isLoadingAuth: false,
            });
        }
    },

    claimUsername: async (username, avatarColor, hatStyle, bio) => {
        set({ isLoadingAuth: true, authError: null });
        try {
            const res = await pandoraApi.setUsername({
                username,
                avatarColor,
                hatStyle,
                bio,
            });
            setStoredToken(res.token);
            set({
                token: res.token,
                account: res.account,
                authStep: 'ready',
                isLoadingAuth: false,
            });
            get().pushToast('Welcome to Pandora!', `Citizen @${res.account.username} registered with £${res.account.balance.toLocaleString()}`, 'emerald');
            await get().hydrateCityData();
            get().connectSocket();
        } catch (err) {
            set({
                authError: err instanceof Error ? err.message : 'Failed to claim username',
                isLoadingAuth: false,
            });
        }
    },

    logout: () => {
        get().disconnectSocket();
        setStoredToken(null);
        set({
            token: null,
            account: null,
            authStep: 'auth',
            remotePlayers: {},
            isPhoneOpen: false,
        });
    },

    hydrateCityData: async () => {
        try {
            const [properties, stores, ledger, inventory, citizens, smsMessages, notifications] = await Promise.all([
                pandoraApi.listProperties(),
                pandoraApi.listStores(),
                pandoraApi.getLedger(),
                pandoraApi.getInventory(),
                pandoraApi.listCitizens(),
                pandoraApi.getRecentMessages(),
                pandoraApi.getNotifications(),
            ]);

            set((state) => ({
                properties,
                stores,
                inventory,
                transactions: ledger.transactions,
                stipendCooldown: ledger.stipendCooldownSeconds,
                citizens,
                smsMessages,
                notifications,
                account: state.account ? { ...state.account, balance: ledger.balance } : null,
            }));
        } catch {
            return;
        }
    },

    connectSocket: () => {
        const existing = get().socket;
        if (existing) {
            existing.disconnect();
        }

        const token = getStoredToken();
        if (!token) return;

        const socket = io('/', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socket.on('world:snapshot', (payload: { zoneId: string; players: PlayerSpatialState[]; onlineCount: number }) => {
            const myId = get().account?.id;
            const map: Record<string, PlayerSpatialState> = {};
            for (const p of payload.players) {
                if (p.accountId !== myId) {
                    map[p.accountId] = p;
                }
            }
            set({
                remotePlayers: map,
                onlineCount: payload.onlineCount,
            });
        });

        socket.on('world:state-delta', (payload: { zoneId: string; updates: PlayerSpatialState[] }) => {
            const myId = get().account?.id;
            const myZone = get().currentZone;
            if (payload.zoneId !== myZone) return;

            set((state) => {
                const next = { ...state.remotePlayers };
                for (const u of payload.updates) {
                    if (u.accountId !== myId) {
                        next[u.accountId] = u;
                    }
                }
                return { remotePlayers: next };
            });
        });

        socket.on('player:joined', (player: PlayerSpatialState) => {
            const myId = get().account?.id;
            if (player.accountId === myId) return;
            set((state) => ({
                remotePlayers: {
                    ...state.remotePlayers,
                    [player.accountId]: player,
                },
            }));
        });

        socket.on('player:left', (payload: { accountId: string }) => {
            set((state) => {
                const next = { ...state.remotePlayers };
                delete next[payload.accountId];
                return { remotePlayers: next };
            });
        });

        socket.on('world:online-count', (payload: { onlineCount: number; citizens: OnlineCitizenSummary[] }) => {
            set({
                onlineCount: payload.onlineCount,
                onlineCitizens: payload.citizens,
            });
        });

        socket.on('chat:message', (msg: PublicChatMessage) => {
            set((state) => ({
                chatMessages: [...state.chatMessages.slice(-60), msg],
                headBubbles: {
                    ...state.headBubbles,
                    [msg.accountId]: {
                        text: msg.message,
                        expiresAt: Date.now() + 6500,
                    },
                },
            }));
        });

        socket.on('wallet:updated', (payload: { balance: number; transaction: EconomyTransaction }) => {
            set((state) => ({
                account: state.account ? { ...state.account, balance: payload.balance } : null,
                transactions: [
                    payload.transaction,
                    ...state.transactions.filter((t) => t.id !== payload.transaction.id),
                ].slice(0, 60),
            }));
        });

        socket.on('property:updated', (updatedProp: Property) => {
            set((state) => ({
                properties: state.properties.map((p) => (p.id === updatedProp.id ? updatedProp : p)),
            }));
        });

        socket.on('phone:sms', (msg: PhoneMessage) => {
            set((state) => {
                const exists = state.smsMessages.some((m) => m.id === msg.id);
                if (exists) return state;
                return {
                    smsMessages: [...state.smsMessages, msg],
                };
            });
        });

        socket.on('phone:notification', (notif: PhoneNotification) => {
            set((state) => ({
                notifications: [notif, ...state.notifications.filter((n) => n.id !== notif.id)].slice(0, 40),
            }));
            const variant =
                notif.type === 'transfer_received' || notif.type === 'stipend_claimed'
                    ? 'emerald'
                    : notif.type === 'house_purchased' || notif.type === 'house_sold'
                      ? 'gold'
                      : 'info';
            get().pushToast(notif.title, notif.body, variant);
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const s = get().socket;
        if (s) {
            s.disconnect();
            set({ socket: null });
        }
    },

    updateLocalTransform: (x, y, z, rotationY) => {
        set({
            localPosition: [x, y, z],
            localRotationY: rotationY,
        });

        const now = performance.now();
        if (now - lastMoveEmitTime >= 48) {
            lastMoveEmitTime = now;
            get().socket?.emit('player:move', { x, y, z, rotationY });
        }
    },

    teleportToExterior: async (x, z) => {
        const currentZone = get().currentZone;
        if (currentZone !== 'exterior') {
            await pandoraApi.exitToStreet().catch(() => undefined);
            get().socket?.emit('player:zone', { zoneId: 'exterior', x, y: 0, z });
        } else {
            get().socket?.emit('player:move', { x, y: 0, z, rotationY: 0 });
        }
        set({
            currentZone: 'exterior',
            localPosition: [x, 0, z],
            nearbyPortal: null,
        });
    },

    enterHouse: async (propertyId) => {
        try {
            const res = await pandoraApi.enterProperty(propertyId);
            set({
                currentZone: res.zoneId,
                localPosition: [0, 0, 4.5],
                localRotationY: Math.PI,
                nearbyPortal: null,
            });
            get().socket?.emit('player:zone', {
                zoneId: res.zoneId,
                x: 0,
                y: 0,
                z: 4.5,
            });
            get().pushToast(res.property.name, `Stepped inside (${res.property.district})`, 'gold');
        } catch (err) {
            get().pushToast(
                'Door Locked',
                err instanceof Error ? err.message : 'Unable to enter property',
                'crimson',
            );
        }
    },

    enterStoreBuilding: async (storeSlug) => {
        try {
            const res = await pandoraApi.enterStore(storeSlug);
            set({
                currentZone: res.zoneId,
                localPosition: [0, 0, 5],
                localRotationY: Math.PI,
                nearbyPortal: null,
            });
            get().socket?.emit('player:zone', {
                zoneId: res.zoneId,
                x: 0,
                y: 0,
                z: 5,
            });
            get().pushToast(res.store.name, res.store.subtitle, 'gold');
        } catch (err) {
            get().pushToast(
                'Cannot Enter Store',
                err instanceof Error ? err.message : 'Unable to enter store',
                'crimson',
            );
        }
    },

    exitBuildingToStreet: async () => {
        const prevZone = get().currentZone;
        let spawnX = 0;
        let spawnZ = 20;

        if (prevZone.startsWith('house:')) {
            const propId = prevZone.slice('house:'.length);
            const prop = get().properties.find((p) => p.id === propId);
            if (prop) {
                const offsetZ = prop.posZ < 0 ? 7.5 : -7.5;
                spawnX = prop.posX;
                spawnZ = prop.posZ + offsetZ;
            }
        } else if (prevZone.startsWith('store:')) {
            const slug = prevZone.slice('store:'.length);
            const store = get().stores.find((s) => s.slug === slug);
            if (store) {
                const offsetZ = store.posZ < 0 ? 6.5 : -6.5;
                spawnX = store.posX;
                spawnZ = store.posZ + offsetZ;
            }
        }

        await pandoraApi.exitToStreet().catch(() => undefined);
        set({
            currentZone: 'exterior',
            localPosition: [spawnX, 0, spawnZ],
            nearbyPortal: null,
        });
        get().socket?.emit('player:zone', {
            zoneId: 'exterior',
            x: spawnX,
            y: 0,
            z: spawnZ,
        });
    },

    buyHouse: async (propertyId) => {
        try {
            const res = await pandoraApi.buyProperty(propertyId);
            set((state) => ({
                properties: state.properties.map((p) => (p.id === propertyId ? res.property : p)),
                account: state.account ? { ...state.account, balance: res.balance } : null,
            }));
            get().pushToast('Deed Registered!', res.message, 'emerald');
        } catch (err) {
            get().pushToast(
                'Purchase Failed',
                err instanceof Error ? err.message : 'Could not complete property purchase',
                'crimson',
            );
        }
    },

    updateHouseSettings: async (propertyId, settings) => {
        try {
            const updated = await pandoraApi.updatePropertySettings(propertyId, settings);
            set((state) => ({
                properties: state.properties.map((p) => (p.id === propertyId ? updated : p)),
            }));
            get().pushToast('House Updated', `${updated.name} preferences saved`, 'gold');
        } catch (err) {
            get().pushToast(
                'Update Failed',
                err instanceof Error ? err.message : 'Could not update house settings',
                'crimson',
            );
        }
    },

    sendMoney: async (recipientUsername, amount, note) => {
        const res = await pandoraApi.transferMoney(recipientUsername, amount, note);
        set((state) => ({
            account: state.account ? { ...state.account, balance: res.balance } : null,
        }));
    },

    claimCivicStipend: async (activity) => {
        try {
            const res = await pandoraApi.claimStipend(activity);
            set((state) => ({
                account: state.account ? { ...state.account, balance: res.balance } : null,
                stipendCooldown: res.cooldownSeconds,
            }));
        } catch (err) {
            get().pushToast(
                'Stipend Cooldown',
                err instanceof Error ? err.message : 'Could not claim stipend yet',
                'crimson',
            );
        }
    },

    buyStoreItem: async (storeSlug, sku) => {
        try {
            const res = await pandoraApi.purchaseStoreItem(storeSlug, sku, 1);
            set((state) => {
                const others = state.inventory.filter((i) => i.id !== res.item.id);
                return {
                    inventory: [res.item, ...others],
                    account: state.account
                        ? {
                              ...state.account,
                              balance: res.balance,
                              avatarColor: res.avatarColor,
                              hatStyle: res.hatStyle,
                          }
                        : null,
                };
            });
            get().socket?.emit('player:appearance', {
                avatarColor: res.avatarColor,
                hatStyle: res.hatStyle,
            });
        } catch (err) {
            get().pushToast(
                'Purchase Declined',
                err instanceof Error ? err.message : 'Unable to purchase item',
                'crimson',
            );
        }
    },

    toggleEquipItem: async (inventoryId) => {
        try {
            const res = await pandoraApi.equipItem(inventoryId);
            set((state) => ({
                inventory: state.inventory.map((i) => (i.id === inventoryId ? res.item : i)),
                account: state.account
                    ? {
                          ...state.account,
                          avatarColor: res.avatarColor,
                          hatStyle: res.hatStyle,
                      }
                    : null,
            }));
            get().socket?.emit('player:appearance', {
                avatarColor: res.avatarColor,
                hatStyle: res.hatStyle,
            });
            get().pushToast('Wardrobe Updated', `${res.item.itemName} ${res.item.isEquipped ? 'equipped' : 'stored'}`, 'gold');
        } catch (err) {
            get().pushToast('Wardrobe Error', err instanceof Error ? err.message : 'Failed to equip', 'crimson');
        }
    },

    sendSmsMessage: async (recipientUsername, content) => {
        const saved = await pandoraApi.sendSms(recipientUsername, content);
        set((state) => {
            const exists = state.smsMessages.some((m) => m.id === saved.id);
            if (exists) return state;
            return { smsMessages: [...state.smsMessages, saved] };
        });
    },

    sendPublicChat: (message) => {
        const clean = message.trim();
        if (!clean) return;
        get().socket?.emit('chat:public', { message: clean });
    },

    markAllNotificationsRead: async () => {
        await pandoraApi.markNotificationsRead().catch(() => undefined);
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
    },
}));

