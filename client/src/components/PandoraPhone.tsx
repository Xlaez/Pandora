import React, { useRef, useState } from 'react';
import {
    ArrowLeft,
    ArrowUpRight,
    Banknote,
    Bell,
    Building,
    Check,
    Compass,
    Crown,
    Home,
    Lock,
    MapPin,
    MessageSquare,
    Send,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Unlock,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { usePandoraStore } from '../store/usePandoraStore';
import { InteriorTheme, PhoneAppId } from '../types/pandora';

export const PandoraPhone: React.FC = () => {
    const {
        isPhoneOpen,
        activePhoneApp,
        account,
        properties,
        stores,
        inventory,
        transactions,
        citizens,
        onlineCitizens,
        smsMessages,
        notifications,
        selectedSmsUsername,
        selectedPropertyId,
        setPhoneOpen,
        setActivePhoneApp,
        setSelectedSmsUsername,
        setSelectedPropertyId,
        sendMoney,
        claimCivicStipend,
        buyHouse,
        enterHouse,
        enterStoreBuilding,
        updateHouseSettings,
        teleportToExterior,
        buyStoreItem,
        toggleEquipItem,
        sendSmsMessage,
        markAllNotificationsRead,
        pushToast,
    } = usePandoraStore();

    const [recipientHandle, setRecipientHandle] = useState('');
    const [transferAmount, setTransferAmount] = useState('500');
    const [transferNote, setTransferNote] = useState('');
    const [isSendingMoney, setIsSendingMoney] = useState(false);

    const [realtyFilter, setRealtyFilter] = useState<'all' | 'sale' | 'mine'>('all');
    const [smsDraft, setSmsDraft] = useState('');
    const [smsTargetInput, setSmsTargetInput] = useState('');
    const [citizenSearch, setCitizenSearch] = useState('');

    const smsFormRef = useRef<HTMLFormElement | null>(null);
    const lastCompositionEndRef = useRef<number | null>(null);

    if (!isPhoneOpen || !account) return null;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleTransferSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const amt = parseInt(transferAmount, 10);
        if (!recipientHandle.trim() || Number.isNaN(amt) || amt <= 0) return;

        setIsSendingMoney(true);
        try {
            await sendMoney(recipientHandle.trim(), amt, transferNote.trim() || undefined);
            setTransferNote('');
            pushToast('RoyalPay Transfer Complete', `Sent £${amt.toLocaleString()} to @${recipientHandle.replace(/^@/, '')}`, 'emerald');
        } catch (err) {
            pushToast('Transfer Failed', err instanceof Error ? err.message : 'Transfer declined', 'crimson');
        } finally {
            setIsSendingMoney(false);
        }
    };

    const activeChatPartner = selectedSmsUsername || smsTargetInput.replace(/^@/, '').trim();

    const activeThreadMessages = smsMessages.filter(
        (m) =>
            (m.senderUsername.toLowerCase() === activeChatPartner.toLowerCase() && m.recipientId === account.id) ||
            (m.recipientUsername.toLowerCase() === activeChatPartner.toLowerCase() && m.senderId === account.id),
    );

    const handleSendSmsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeChatPartner || !smsDraft.trim()) return;
        try {
            await sendSmsMessage(activeChatPartner, smsDraft.trim());
            setSmsDraft('');
        } catch (err) {
            pushToast('SMS Delivery Error', err instanceof Error ? err.message : 'Failed to send SMS', 'crimson');
        }
    };

    const handleSmsKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (event.nativeEvent.isComposing || event.keyCode === 229) {
                return;
            }
            if (
                lastCompositionEndRef.current !== null &&
                Math.abs(event.timeStamp - lastCompositionEndRef.current) < 50
            ) {
                return;
            }
            smsFormRef.current?.requestSubmit();
        }
    };

    const filteredProperties = properties.filter((p) => {
        if (realtyFilter === 'sale') return p.isForSale;
        if (realtyFilter === 'mine') return p.ownerId === account.id;
        return true;
    });

    const filteredCitizens = citizens.filter((c) => {
        if (!citizenSearch.trim()) return true;
        return c.username?.toLowerCase().includes(citizenSearch.trim().toLowerCase());
    });

    const openQuickPay = (username: string) => {
        setRecipientHandle(username);
        setActivePhoneApp('bank');
    };

    const openQuickSms = (username: string) => {
        setSelectedSmsUsername(username);
        setSmsTargetInput(username);
        setActivePhoneApp('sms');
    };

    return (
        <div className="fixed bottom-5 right-5 z-40 w-[375px] h-[690px] max-h-[88vh] rounded-[42px] border-[4px] border-[#C9A03F]/70 bg-[#070E17] shadow-[0_28px_90px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-[#0A1421] border-b border-white/5 text-[11px] font-mono text-[#CBD7E6]">
                <span className="font-bold text-[#E5B84B]">PandoraOS 5G</span>
                <div className="w-20 h-4 rounded-full bg-black/80 border border-white/10" />
                <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">£{account.balance.toLocaleString()}</span>
                    <button
                        type="button"
                        onClick={() => setPhoneOpen(false)}
                        title="Close Phone (P)"
                        className="rounded-full p-0.5 text-[#9FB1C6] hover:text-white"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {activePhoneApp !== 'home' && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0E1B2B] border-b border-white/10">
                    <button
                        type="button"
                        onClick={() => setActivePhoneApp('home')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E5B84B] hover:underline"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Home
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {activePhoneApp === 'bank' && 'RoyalPay Bank'}
                        {activePhoneApp === 'realty' && 'Rightmove Estates'}
                        {activePhoneApp === 'sms' && 'Royal Messenger'}
                        {activePhoneApp === 'directory' && 'Citizen Directory'}
                        {activePhoneApp === 'wardrobe' && 'Boutique & Wardrobe'}
                        {activePhoneApp === 'map' && 'Pandora Radar'}
                    </span>
                    <div className="w-10" />
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activePhoneApp === 'home' && (
                    <>
                        <div className="rounded-2xl bg-gradient-to-br from-[#1B334B] via-[#102033] to-[#081019] p-4 border border-[#E5B84B]/30 shadow-lg">
                            <div className="flex items-center justify-between text-xs text-[#9FB1C6]">
                                <span>Royal Bank of Pandora</span>
                                <span className="font-mono text-[#E5B84B]">@{account.username}</span>
                            </div>
                            <div className="mt-1 font-display text-2xl font-bold text-white">
                                £{account.balance.toLocaleString()}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActivePhoneApp('bank')}
                                    className="flex-1 rounded-xl bg-[#E5B84B] py-1.5 text-xs font-bold text-[#081019] hover:brightness-110 transition"
                                >
                                    Send / Receive £
                                </button>
                                <button
                                    type="button"
                                    onClick={() => claimCivicStipend('Royal Borough Daily Commerce Grant')}
                                    className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                                >
                                    +£1,250 Grant
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {(
                                [
                                    {
                                        id: 'bank',
                                        label: 'RoyalPay',
                                        color: 'from-amber-500 to-yellow-600',
                                        icon: Wallet,
                                    },
                                    {
                                        id: 'realty',
                                        label: 'Rightmove',
                                        color: 'from-emerald-500 to-teal-700',
                                        icon: Building,
                                    },
                                    {
                                        id: 'sms',
                                        label: 'Messenger',
                                        color: 'from-sky-500 to-blue-700',
                                        icon: MessageSquare,
                                    },
                                    {
                                        id: 'directory',
                                        label: 'Citizens',
                                        color: 'from-purple-500 to-indigo-700',
                                        icon: Users,
                                    },
                                    {
                                        id: 'wardrobe',
                                        label: 'Harrods/Shop',
                                        color: 'from-rose-500 to-red-700',
                                        icon: ShoppingBag,
                                    },
                                    {
                                        id: 'map',
                                        label: 'City Radar',
                                        color: 'from-cyan-500 to-slate-700',
                                        icon: Compass,
                                    },
                                ] as {
                                    id: PhoneAppId;
                                    label: string;
                                    color: string;
                                    icon: React.ComponentType<{ className?: string }>;
                                }[]
                            ).map((app) => {
                                const IconComp = app.icon;
                                return (
                                    <button
                                        key={app.id}
                                        type="button"
                                        onClick={() => setActivePhoneApp(app.id)}
                                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0E1B2B]/80 p-3 hover:border-[#E5B84B]/50 hover:scale-105 transition"
                                    >
                                        <div
                                            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-md`}
                                        >
                                            <IconComp className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-[#F4EFE6]">{app.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#0B1522] p-3.5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E5B84B]">
                                    <Bell className="w-3.5 h-3.5" />
                                    Live Citizen Alerts {unreadCount > 0 && `(${unreadCount})`}
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => markAllNotificationsRead()}
                                        className="text-[10px] text-[#9FB1C6] hover:text-white"
                                    >
                                        Mark Read
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="text-xs text-[#6B829E] py-3 text-center">
                                        No recent notifications yet.
                                    </p>
                                ) : (
                                    notifications.slice(0, 12).map((n) => (
                                        <div
                                            key={n.id}
                                            className="rounded-xl border border-white/5 bg-[#070E17]/80 p-2.5 text-xs"
                                        >
                                            <div className="font-bold text-white">{n.title}</div>
                                            <div className="text-[11px] text-[#9FB1C6] mt-0.5">{n.body}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activePhoneApp === 'bank' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-gradient-to-r from-[#E5B84B] to-[#B8860B] p-4 text-[#081019] shadow-lg">
                            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                                Sovereign Current Account
                            </div>
                            <div className="font-display text-2xl font-extrabold mt-0.5">
                                £{account.balance.toLocaleString()}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                                <span>Sort Code: 04-00-77</span>
                                <button
                                    type="button"
                                    onClick={() => claimCivicStipend('Whitehall Treasury Stipend')}
                                    className="rounded-lg bg-[#081019] px-2.5 py-1 text-[11px] font-bold text-[#E5B84B]"
                                >
                                    Claim +£1,250 Stipend
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleTransferSubmit}
                            method="POST"
                            className="rounded-2xl border border-white/10 bg-[#0B1522] p-3.5 space-y-3"
                        >
                            <div className="text-xs font-bold text-[#E5B84B] flex items-center gap-1.5">
                                <Banknote className="w-4 h-4" />
                                Instant Citizen-to-Citizen Transfer
                            </div>

                            <div>
                                <label htmlFor="pay-recipient" className="block text-[11px] text-[#9FB1C6] mb-1">
                                    Recipient Handle (@username)
                                </label>
                                <input
                                    id="pay-recipient"
                                    type="text"
                                    required
                                    value={recipientHandle}
                                    onChange={(e) => setRecipientHandle(e.target.value)}
                                    placeholder="@beatrice"
                                    className="w-full rounded-xl border border-white/15 bg-[#070E17] px-3 py-2 text-xs text-white font-mono focus:border-[#E5B84B] focus:outline-none"
                                />
                            </div>

                            {citizens.filter((c) => c.id !== account.id && c.username).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {citizens
                                        .filter((c) => c.id !== account.id && c.username)
                                        .slice(0, 5)
                                        .map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setRecipientHandle(c.username!)}
                                                className="rounded-lg border border-white/10 bg-[#070E17] px-2 py-1 text-[10px] font-mono text-[#E5B84B] hover:border-[#E5B84B]"
                                            >
                                                @{c.username}
                                            </button>
                                        ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="pay-amount" className="block text-[11px] text-[#9FB1C6] mb-1">
                                        Amount (£)
                                    </label>
                                    <input
                                        id="pay-amount"
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value.replace(/\D/g, ''))}
                                        className="w-full rounded-xl border border-white/15 bg-[#070E17] px-3 py-2 text-xs text-white font-mono focus:border-[#E5B84B] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pay-note" className="block text-[11px] text-[#9FB1C6] mb-1">
                                        Reference Note
                                    </label>
                                    <input
                                        id="pay-note"
                                        type="text"
                                        value={transferNote}
                                        onChange={(e) => setTransferNote(e.target.value)}
                                        placeholder="Dinner in Soho"
                                        className="w-full rounded-xl border border-white/15 bg-[#070E17] px-3 py-2 text-xs text-white focus:border-[#E5B84B] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSendingMoney || !recipientHandle.trim()}
                                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-[#081019] hover:bg-emerald-400 transition disabled:opacity-50"
                            >
                                {isSendingMoney ? 'Executing RoyalPay Transfer...' : `Send £${Number(transferAmount || 0).toLocaleString()}`}
                            </button>
                        </form>

                        <div className="space-y-2">
                            <div className="text-xs font-bold text-[#CBD7E6]">Recent Ledger Activity</div>
                            {transactions.map((tx) => {
                                const isIncoming = tx.recipientId === account.id;
                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B1522] p-2.5 text-xs"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="font-semibold text-white truncate">{tx.note}</div>
                                            <div className="text-[10px] text-[#8FA4BC] font-mono">
                                                {isIncoming
                                                    ? `From @${tx.senderUsername ?? 'treasury'}`
                                                    : `To @${tx.recipientUsername ?? 'merchant'}`}
                                            </div>
                                        </div>
                                        <div
                                            className={`font-mono font-bold whitespace-nowrap ${
                                                isIncoming ? 'text-emerald-400' : 'text-amber-300'
                                            }`}
                                        >
                                            {isIncoming ? '+' : '-'}£{tx.amount.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activePhoneApp === 'realty' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0B1522] p-1 border border-white/10">
                            {(
                                [
                                    ['all', `All (${properties.length})`],
                                    ['sale', `For Sale (${properties.filter((p) => p.isForSale).length})`],
                                    ['mine', `Owned (${properties.filter((p) => p.ownerId === account.id).length})`],
                                ] as ['all' | 'sale' | 'mine', string][]
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setRealtyFilter(key)}
                                    className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                                        realtyFilter === key
                                            ? 'bg-[#E5B84B] text-[#081019]'
                                            : 'text-[#9FB1C6] hover:text-white'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {filteredProperties.map((prop) => {
                            const isMine = prop.ownerId === account.id;
                            const isHighlighted = selectedPropertyId === prop.id;
                            return (
                                <div
                                    key={prop.id}
                                    onClick={() => setSelectedPropertyId(prop.id)}
                                    className={`rounded-2xl border p-3.5 transition ${
                                        isHighlighted
                                            ? 'border-[#E5B84B] bg-[#13243A]'
                                            : 'border-white/10 bg-[#0B1522]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E5B84B]">
                                                {prop.district} · {prop.floors} Floors
                                            </span>
                                            <h3 className="text-sm font-bold text-white">{prop.name}</h3>
                                            <p className="text-[11px] text-[#8FA4BC]">{prop.address}</p>
                                        </div>
                                        <div className="text-right font-mono">
                                            <div className="text-sm font-bold text-[#E5B84B]">
                                                £{prop.price.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-[#9FB1C6]">
                                                {isMine
                                                    ? '★ Owned by You'
                                                    : prop.ownerUsername
                                                      ? `@${prop.ownerUsername}`
                                                      : 'Crown Estate'}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-[#B8C7D9] mt-2">{prop.description}</p>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const offsetZ = prop.posZ < 0 ? 7.5 : -7.5;
                                                teleportToExterior(prop.posX, prop.posZ + offsetZ);
                                            }}
                                            className="rounded-lg border border-white/15 bg-[#070E17] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:border-[#E5B84B]"
                                        >
                                            Teleport
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => enterHouse(prop.id)}
                                            className="rounded-lg border border-sky-400/40 bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/30"
                                        >
                                            Enter House
                                        </button>

                                        {prop.isForSale && !isMine && (
                                            <button
                                                type="button"
                                                onClick={() => buyHouse(prop.id)}
                                                className="flex-1 rounded-lg bg-[#E5B84B] px-3 py-1.5 text-[11px] font-bold text-[#081019] hover:brightness-110"
                                            >
                                                Buy · £{prop.price.toLocaleString()}
                                            </button>
                                        )}

                                        {isMine && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateHouseSettings(prop.id, { isLocked: !prop.isLocked })
                                                }
                                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                                                    prop.isLocked
                                                        ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                                }`}
                                            >
                                                {prop.isLocked ? (
                                                    <>
                                                        <Lock className="w-3 h-3" /> Locked
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="w-3 h-3" /> Open
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activePhoneApp === 'sms' && (
                    <div className="flex flex-col h-[530px]">
                        <div className="mb-3">
                            <label htmlFor="sms-recipient-input" className="block text-[11px] text-[#9FB1C6] mb-1">
                                Recipient Citizen (@username)
                            </label>
                            <input
                                id="sms-recipient-input"
                                type="text"
                                value={selectedSmsUsername ?? smsTargetInput}
                                onChange={(e) => {
                                    setSelectedSmsUsername(null);
                                    setSmsTargetInput(e.target.value);
                                }}
                                placeholder="Type @username or pick below"
                                className="w-full rounded-xl border border-white/15 bg-[#0B1522] px-3 py-2 text-xs text-white font-mono focus:border-[#E5B84B] focus:outline-none"
                            />
                            <div className="flex gap-1.5 overflow-x-auto py-1.5">
                                {citizens
                                    .filter((c) => c.id !== account.id && c.username)
                                    .map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSmsUsername(c.username!);
                                                setSmsTargetInput(c.username!);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap border ${
                                                activeChatPartner.toLowerCase() === c.username!.toLowerCase()
                                                    ? 'bg-[#E5B84B] text-[#081019] border-[#E5B84B] font-bold'
                                                    : 'bg-[#0B1522] text-[#CBD7E6] border-white/10'
                                            }`}
                                        >
                                            @{c.username}
                                        </button>
                                    ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#0B1522] p-3 space-y-2">
                            {activeThreadMessages.length === 0 ? (
                                <p className="text-xs text-[#6B829E] text-center py-10">
                                    {activeChatPartner
                                        ? `Start a conversation with @${activeChatPartner}`
                                        : 'Select a citizen above to send an SMS.'}
                                </p>
                            ) : (
                                activeThreadMessages.map((m) => {
                                    const isMe = m.senderId === account.id;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                        >
                                            <div
                                                className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs ${
                                                    isMe
                                                        ? 'bg-[#E5B84B] text-[#081019] font-medium'
                                                        : 'bg-[#162942] text-white'
                                                }`}
                                            >
                                                {m.content}
                                            </div>
                                            <span className="text-[9px] text-[#6B829E] mt-0.5 font-mono">
                                                @{m.senderUsername}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form
                            ref={smsFormRef}
                            onSubmit={handleSendSmsSubmit}
                            method="POST"
                            className="mt-2.5 flex items-end gap-2"
                        >
                            <label htmlFor="phone-sms-textarea" className="sr-only">
                                SMS Message
                            </label>
                            <textarea
                                id="phone-sms-textarea"
                                rows={2}
                                value={smsDraft}
                                onChange={(e) => setSmsDraft(e.target.value)}
                                onCompositionEnd={(e) => {
                                    lastCompositionEndRef.current = e.timeStamp;
                                }}
                                onKeyDown={handleSmsKeyDown}
                                placeholder={
                                    activeChatPartner
                                        ? `Message @${activeChatPartner}...`
                                        : 'Select a recipient first...'
                                }
                                className="flex-1 resize-none rounded-xl border border-white/15 bg-[#0B1522] px-3 py-2 text-xs text-white focus:border-[#E5B84B] focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!activeChatPartner || !smsDraft.trim()}
                                className="h-10 w-10 rounded-xl bg-[#E5B84B] flex items-center justify-center text-[#081019] disabled:opacity-40"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}

                {activePhoneApp === 'directory' && (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={citizenSearch}
                            onChange={(e) => setCitizenSearch(e.target.value)}
                            placeholder="Search citizens by @username..."
                            className="w-full rounded-xl border border-white/15 bg-[#0B1522] px-3 py-2 text-xs text-white focus:border-[#E5B84B] focus:outline-none"
                        />

                        {filteredCitizens.map((c) => {
                            const isOnline = onlineCitizens.some((o) => o.accountId === c.id);
                            const isMe = c.id === account.id;
                            return (
                                <div
                                    key={c.id}
                                    className="rounded-2xl border border-white/10 bg-[#0B1522] p-3 flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/20"
                                            style={{ backgroundColor: c.avatarColor }}
                                        >
                                            {c.username?.slice(0, 2).toUpperCase() || 'CZ'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold font-mono text-white truncate">
                                                    @{c.username}
                                                </span>
                                                {isOnline && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online now" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-[#8FA4BC] truncate">{c.bio}</div>
                                        </div>
                                    </div>

                                    {!isMe && c.username && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openQuickPay(c.username!)}
                                                className="rounded-lg bg-[#E5B84B] px-2.5 py-1 text-[10px] font-bold text-[#081019]"
                                            >
                                                Send £
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openQuickSms(c.username!)}
                                                className="rounded-lg border border-white/15 bg-[#070E17] px-2.5 py-1 text-[10px] font-semibold text-white"
                                            >
                                                SMS
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activePhoneApp === 'wardrobe' && (
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-bold text-[#E5B84B] mb-2">
                                Owned Citizen Inventory ({inventory.length})
                            </div>
                            {inventory.length === 0 ? (
                                <p className="rounded-xl border border-white/10 bg-[#0B1522] p-3 text-xs text-[#8FA4BC]">
                                    You haven’t bought any items yet. Visit Harrods, Savile Row, Fortnum Grocer, or the Crown & Anchor Pub below!
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {inventory.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B1522] p-2.5 text-xs"
                                        >
                                            <div>
                                                <div className="font-bold text-white">
                                                    {item.itemName} <span className="text-[#E5B84B]">x{item.quantity}</span>
                                                </div>
                                                <div className="text-[10px] text-[#8FA4BC] uppercase">{item.category}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleEquipItem(item.id)}
                                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                                                    item.isEquipped
                                                        ? 'bg-emerald-500 text-[#081019]'
                                                        : 'border border-white/20 text-white'
                                                }`}
                                            >
                                                {item.isEquipped ? 'Equipped' : 'Use / Equip'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-bold text-[#E5B84B]">
                                Pandora High Street Stores
                            </div>
                            {stores.map((store) => (
                                <div
                                    key={store.slug}
                                    className="rounded-2xl border border-white/10 bg-[#0B1522] p-3 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-white">{store.name}</div>
                                            <div className="text-[10px] text-[#8FA4BC]">{store.address}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => enterStoreBuilding(store.slug)}
                                            className="rounded-lg border border-[#E5B84B]/40 bg-[#E5B84B]/15 px-2.5 py-1 text-[10px] font-bold text-[#E5B84B]"
                                        >
                                            Enter 3D Store
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        {store.items.map((item) => (
                                            <button
                                                key={item.sku}
                                                type="button"
                                                onClick={() => buyStoreItem(store.slug, item.sku)}
                                                className="rounded-xl border border-white/10 bg-[#070E17] p-2 text-left hover:border-[#E5B84B] transition"
                                            >
                                                <div className="text-[11px] font-bold text-white truncate">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] font-mono text-[#E5B84B] mt-0.5">
                                                    £{item.price.toLocaleString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activePhoneApp === 'map' && (
                    <div className="space-y-3">
                        <div className="text-xs text-[#9FB1C6]">
                            Tap any landmark, store, or residence to fast-travel across Pandora:
                        </div>

                        <div className="relative w-full h-64 rounded-2xl border border-[#E5B84B]/40 bg-[#0B1E17] overflow-hidden">
                            <div className="absolute inset-x-0 top-[20%] h-4 bg-[#0D3B66]" title="River Thames" />
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-[#1E2631]" />
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-[#1E2631]" />

                            <button
                                type="button"
                                onClick={() => teleportToExterior(0, 18)}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#E5B84B] border-2 border-white shadow flex items-center justify-center text-[9px] font-bold text-black"
                                title="Pandora Clock Tower Plaza"
                            >
                                ★
                            </button>

                            {properties.map((p) => {
                                const leftPct = 50 + (p.posX / 160) * 100;
                                const topPct = 50 + (p.posZ / 130) * 100;
                                const isMine = p.ownerId === account.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                            const offsetZ = p.posZ < 0 ? 7.5 : -7.5;
                                            teleportToExterior(p.posX, p.posZ + offsetZ);
                                        }}
                                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                                        title={`${p.name} (£${p.price.toLocaleString()})`}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-sm border ${
                                            isMine
                                                ? 'bg-emerald-400 border-white'
                                                : p.isForSale
                                                  ? 'bg-amber-400 border-black'
                                                  : 'bg-sky-400 border-black'
                                        }`}
                                    />
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => teleportToExterior(0, 18)}
                                className="rounded-xl border border-white/10 bg-[#0B1522] p-2.5 text-left text-xs hover:border-[#E5B84B]"
                            >
                                <div className="font-bold text-[#E5B84B]">Westminster Clock Plaza</div>
                                <div className="text-[10px] text-[#8FA4BC]">Central Pandora (0, 18)</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => teleportToExterior(0, -42)}
                                className="rounded-xl border border-white/10 bg-[#0B1522] p-2.5 text-left text-xs hover:border-[#E5B84B]"
                            >
                                <div className="font-bold text-sky-300">Thames Embankment Bridge</div>
                                <div className="text-[10px] text-[#8FA4BC]">Riverfront Walk (0, -42)</div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="py-2.5 bg-[#0A1421] border-t border-white/10 flex justify-center">
                <button
                    type="button"
                    onClick={() => setActivePhoneApp('home')}
                    aria-label="Phone Home Screen"
                    className="w-28 h-1.5 rounded-full bg-white/40 hover:bg-[#E5B84B] transition"
                />
            </div>
        </div>
    );
};

