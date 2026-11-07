import React, { useEffect, useRef, useState } from 'react';
import {
    Building2,
    Crown,
    DoorOpen,
    LogOut,
    MessageCircle,
    Moon,
    Send,
    ShoppingBag,
    Smartphone,
    Sun,
    Sunset,
    Users,
    Wallet,
} from 'lucide-react';
import { usePandoraStore } from '../store/usePandoraStore';

export const CityHud: React.FC = () => {
    const {
        account,
        properties,
        currentZone,
        nearbyPortal,
        onlineCount,
        chatMessages,
        notifications,
        isPhoneOpen,
        timeOfDay,
        toasts,
        setTimeOfDay,
        setPhoneOpen,
        enterHouse,
        enterStoreBuilding,
        exitBuildingToStreet,
        buyHouse,
        claimCivicStipend,
        sendPublicChat,
        dismissToast,
        logout,
    } = usePandoraStore();

    const [chatInput, setChatInput] = useState('');
    const chatFormRef = useRef<HTMLFormElement | null>(null);
    const lastCompositionEndRef = useRef<number | null>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const el = document.activeElement;
            const tag = el?.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (e.key.toLowerCase() === 'p') {
                setPhoneOpen(!usePandoraStore.getState().isPhoneOpen);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [setPhoneOpen]);

    if (!account) return null;

    const myHousesCount = properties.filter((p) => p.ownerId === account.id).length;
    const unreadNotifs = notifications.filter((n) => !n.isRead).length;

    const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendPublicChat(chatInput.trim());
        setChatInput('');
    };

    const handleChatKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
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
            chatFormRef.current?.requestSubmit();
        }
    };

    return (
        <>
            <header className="fixed top-4 inset-x-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#E5B84B]/35 bg-[#081019]/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white border border-white/25 shadow"
                        style={{ backgroundColor: account.avatarColor }}
                    >
                        {account.username?.slice(0, 2).toUpperCase() || 'CZ'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">@{account.username}</span>
                            <span className="rounded-md bg-[#E5B84B]/20 px-2 py-0.5 text-[10px] font-bold text-[#E5B84B]">
                                {currentZone === 'exterior' ? 'Streets of Pandora' : 'Inside Building'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#9FB1C6] mt-0.5">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400">
                                <Wallet className="w-3.5 h-3.5" />
                                £{account.balance.toLocaleString()}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-[#E5B84B]" />
                                {myHousesCount} {myHousesCount === 1 ? 'Deed' : 'Deeds'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-sky-400" />
                                {onlineCount} Online
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/15 bg-[#081019]/90 px-3 py-2 shadow-2xl backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => claimCivicStipend('Royal Treasury Stipend')}
                        className="rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                    >
                        +£1,250 Stipend
                    </button>

                    <button
                        type="button"
                        onClick={() => setPhoneOpen(true, 'bank')}
                        className="rounded-xl bg-[#E5B84B] px-3 py-1.5 text-xs font-bold text-[#081019] hover:brightness-110 transition"
                    >
                        RoyalPay
                    </button>

                    <button
                        type="button"
                        onClick={() => setPhoneOpen(true, 'realty')}
                        className="rounded-xl border border-[#E5B84B]/40 bg-[#0E1B2B] px-3 py-1.5 text-xs font-semibold text-[#F4EFE6] hover:border-[#E5B84B] transition"
                    >
                        Houses ({properties.length})
                    </button>

                    <div className="flex items-center rounded-xl bg-[#070E17] p-0.5 border border-white/10">
                        {(
                            [
                                ['day', Sun],
                                ['dusk', Sunset],
                                ['night', Moon],
                            ] as ['day' | 'dusk' | 'night', React.ComponentType<{ className?: string }>][]
                        ).map(([mode, Icon]) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setTimeOfDay(mode)}
                                title={`Sky: ${mode}`}
                                className={`p-1.5 rounded-lg transition ${
                                    timeOfDay === mode
                                        ? 'bg-[#E5B84B] text-[#081019]'
                                        : 'text-[#8FA4BC] hover:text-white'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        title="Sign out"
                        className="p-2 rounded-xl text-[#9FB1C6] hover:text-red-400 transition"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="fixed top-20 right-4 z-30 flex flex-col gap-2 w-80 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => dismissToast(t.id)}
                        className={`pointer-events-auto cursor-pointer rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md transition ${
                            t.variant === 'emerald'
                                ? 'border-emerald-400/50 bg-[#062419]/95 text-emerald-100'
                                : t.variant === 'crimson'
                                  ? 'border-red-400/50 bg-[#2A0B0E]/95 text-red-100'
                                  : 'border-[#E5B84B]/50 bg-[#081019]/95 text-[#F4EFE6]'
                        }`}
                    >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-[#E5B84B]" />
                            {t.title}
                        </div>
                        <div className="text-[11px] opacity-90 mt-0.5">{t.body}</div>
                    </div>
                ))}
            </div>

            {currentZone === 'exterior' && nearbyPortal && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <div className="rounded-2xl border-2 border-[#E5B84B] bg-[#081019]/95 px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center gap-5">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#E5B84B]">
                                {nearbyPortal.kind === 'house' ? 'Residential Portal' : 'High Street Storefront'}
                            </div>
                            <div className="font-display text-base font-bold text-white">
                                {nearbyPortal.name}
                            </div>
                            <div className="text-xs text-[#9FB1C6]">{nearbyPortal.subtitle}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    nearbyPortal.kind === 'house'
                                        ? enterHouse(nearbyPortal.id)
                                        : enterStoreBuilding(nearbyPortal.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E5B84B] px-4 py-2.5 text-xs font-bold text-[#081019] hover:brightness-110 transition"
                            >
                                <DoorOpen className="w-4 h-4" />
                                Enter (E)
                            </button>

                            {nearbyPortal.kind === 'house' &&
                                nearbyPortal.isForSale &&
                                nearbyPortal.ownerId !== account.id &&
                                nearbyPortal.price && (
                                    <button
                                        type="button"
                                        onClick={() => buyHouse(nearbyPortal.id)}
                                        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#081019] hover:bg-emerald-400 transition"
                                    >
                                        Buy £{nearbyPortal.price.toLocaleString()}
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {currentZone !== 'exterior' && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => exitBuildingToStreet()}
                        className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#E5B84B] bg-[#081019]/95 px-5 py-3 text-xs font-bold text-[#E5B84B] shadow-2xl hover:bg-[#E5B84B] hover:text-[#081019] transition"
                    >
                        <DoorOpen className="w-4 h-4" />
                        Step Back Out to Pandora Streets (Press E)
                    </button>
                </div>
            )}

            <div className="fixed bottom-5 left-5 z-30 w-80 sm:w-96 pointer-events-auto rounded-2xl border border-white/15 bg-[#081019]/88 p-3 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#9FB1C6] mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[#E5B84B]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Pandora Street Chat
                    </span>
                    <span className="text-[10px]">WASD to Move · Drag to Orbit · E to Enter</span>
                </div>

                <div className="h-28 overflow-y-auto space-y-1.5 pr-1 mb-2 text-xs">
                    {chatMessages.length === 0 ? (
                        <div className="text-[#6B829E] text-[11px] py-6 text-center">
                            Say hello to fellow citizens in Pandora!
                        </div>
                    ) : (
                        chatMessages.map((c) => (
                            <div key={c.id} className="leading-snug">
                                <span className="font-mono font-bold text-[#E5B84B]">@{c.username}: </span>
                                <span className="text-[#F4EFE6]">{c.message}</span>
                            </div>
                        ))
                    )}
                </div>

                <form ref={chatFormRef} onSubmit={handleChatSubmit} className="flex items-center gap-2">
                    <label htmlFor="street-chat-input" className="sr-only">
                        Street Chat Message
                    </label>
                    <input
                        id="street-chat-input"
                        type="text"
                        maxLength={240}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onCompositionEnd={(e) => {
                            lastCompositionEndRef.current = e.timeStamp;
                        }}
                        onKeyDown={handleChatKeyDown}
                        placeholder="Speak to nearby citizens..."
                        className="flex-1 rounded-xl border border-white/15 bg-[#070E17] px-3 py-2 text-xs text-white placeholder-[#5D728A] focus:border-[#E5B84B] focus:outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Send Street Chat"
                        className="rounded-xl bg-[#E5B84B] p-2 text-[#081019] hover:brightness-110 transition"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>

            {!isPhoneOpen && (
                <button
                    type="button"
                    onClick={() => setPhoneOpen(true)}
                    className="fixed bottom-5 right-5 z-30 pointer-events-auto flex items-center gap-3 rounded-2xl border-2 border-[#E5B84B] bg-gradient-to-r from-[#0E1B2B] to-[#081019] px-5 py-3.5 shadow-[0_16px_50px_rgba(0,0,0,0.85)] hover:scale-105 transition"
                >
                    <div className="relative">
                        <Smartphone className="w-6 h-6 text-[#E5B84B]" />
                        {unreadNotifs > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                                {unreadNotifs}
                            </span>
                        )}
                    </div>
                    <div className="text-left">
                        <div className="text-xs font-bold text-white">PandoraPhone</div>
                        <div className="text-[10px] text-[#E5B84B] font-mono">Press P · Bank, Houses, SMS</div>
                    </div>
                </button>
            )}
        </>
    );
};

