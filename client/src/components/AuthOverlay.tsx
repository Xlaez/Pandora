import React, { useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Crown, KeyRound, Mail, RefreshCw, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { usePandoraStore } from '../store/usePandoraStore';

const AVATAR_COLORS = [
    { label: 'Terracotta', hex: '#D96B43' },
    { label: 'Buckingham Crimson', hex: '#C0392B' },
    { label: 'Kensington Emerald', hex: '#1E8449' },
    { label: 'Westminster Navy', hex: '#2471A3' },
    { label: 'Sovereign Gold', hex: '#D4AC0D' },
    { label: 'Mayfair Plum', hex: '#7D3C98' },
];

const HAT_STYLES = [
    { id: 'bowler', label: 'City Bowler' },
    { id: 'tophat', label: 'Ascot Top Hat' },
    { id: 'crown', label: 'Sovereign Crown' },
    { id: 'cap', label: 'Flat Cap' },
    { id: 'none', label: 'No Hat' },
];

interface OtpCredentialResult {
    code: string;
}

export const AuthOverlay: React.FC = () => {
    const {
        authStep,
        pendingEmail,
        devOtpCode,
        isLoadingAuth,
        authError,
        registerAccount,
        loginAccount,
        verifyOtpCode,
        resendOtpCode,
        claimUsername,
    } = usePandoraStore();

    const [mode, setMode] = useState<'register' | 'login'>('register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [username, setUsername] = useState('');
    const [avatarColor, setAvatarColor] = useState('#D96B43');
    const [hatStyle, setHatStyle] = useState('bowler');
    const [bio, setBio] = useState('Citizen of Pandora');

    const otpFormRef = useRef<HTMLFormElement | null>(null);
    const otpAbortRef = useRef<AbortController | null>(null);

    const stopWebOtp = () => {
        if (otpAbortRef.current) {
            otpAbortRef.current.abort();
            otpAbortRef.current = null;
        }
    };

    const startWebOtp = () => {
        if (typeof window === 'undefined' || !('OTPCredential' in window)) {
            return;
        }
        stopWebOtp();
        const ac = new AbortController();
        otpAbortRef.current = ac;

        const nav = navigator.credentials as CredentialsContainer & {
            get: (options?: CredentialRequestOptions & { otp?: { transport: string[] } }) => Promise<Credential | null>;
        };

        nav.get({
            otp: { transport: ['sms'] },
            signal: ac.signal,
        })
            .then((cred) => {
                const otpCred = cred as (Credential & OtpCredentialResult) | null;
                if (otpCred && typeof otpCred.code === 'string') {
                    setOtpValue(otpCred.code);
                    otpFormRef.current?.requestSubmit();
                }
            })
            .catch(() => undefined);
    };

    useEffect(() => {
        if (authStep === 'otp') {
            startWebOtp();
        }
        return () => {
            stopWebOtp();
        };
    }, [authStep]);

    const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (mode === 'register') {
            await registerAccount(email, password);
        } else {
            await loginAccount(email, password);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        stopWebOtp();
        await verifyOtpCode(otpValue.trim());
    };

    const handleResendOtp = async () => {
        stopWebOtp();
        await resendOtpCode();
        startWebOtp();
    };

    const handleUsernameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await claimUsername(username, avatarColor, hatStyle, bio);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060C14]/90 backdrop-blur-xl p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-[#E5B84B]/10 blur-[130px]" />
                <div className="absolute -bottom-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-[#1E6B4B]/15 blur-[130px]" />
            </div>

            <div className="relative w-full max-w-md rounded-3xl border border-[#E5B84B]/30 bg-gradient-to-b from-[#0E1B2B]/95 to-[#081019]/98 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5B84B] to-[#B5831E] flex items-center justify-center shadow-lg shadow-[#E5B84B]/20 mb-3">
                        <Crown className="w-7 h-7 text-[#081019]" />
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.28em] text-[#E5B84B] font-semibold">
                        Royal Borough of Pandora
                    </span>
                    <h1 className="font-display text-3xl font-bold text-[#F4EFE6] mt-1">
                        PANDORA METROPOLIS
                    </h1>
                    <p className="text-xs text-[#9FB1C6] mt-1">
                        Interactive 3D London-Inspired City Simulation
                    </p>
                </div>

                {authError && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-400/40 bg-red-950/60 px-4 py-3 text-xs text-red-200"
                    >
                        {authError}
                    </div>
                )}

                {authStep === 'auth' && (
                    <div>
                        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#070E17] p-1 border border-white/10 mb-6">
                            <button
                                type="button"
                                onClick={() => setMode('register')}
                                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                                    mode === 'register'
                                        ? 'bg-[#E5B84B] text-[#081019] shadow'
                                        : 'text-[#9FB1C6] hover:text-white'
                                }`}
                            >
                                New Citizen Passport
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                                    mode === 'login'
                                        ? 'bg-[#E5B84B] text-[#081019] shadow'
                                        : 'text-[#9FB1C6] hover:text-white'
                                }`}
                            >
                                Returning Citizen
                            </button>
                        </div>

                        <form onSubmit={handleAuthSubmit} method="POST" className="space-y-4">
                            <div>
                                <label
                                    htmlFor="citizen-email"
                                    className="block text-xs font-medium text-[#CBD7E6] mb-1.5"
                                >
                                    Royal Post Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-[#E5B84B] absolute left-3.5 top-3.5" />
                                    <input
                                        id="citizen-email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="citizen@pandora.uk"
                                        className="w-full rounded-xl border border-white/15 bg-[#070E17]/90 pl-10 pr-4 py-3 text-sm text-white placeholder-[#5D728A] focus:border-[#E5B84B] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="citizen-password"
                                    className="block text-xs font-medium text-[#CBD7E6] mb-1.5"
                                >
                                    Passkey / Password
                                </label>
                                <div className="relative">
                                    <KeyRound className="w-4 h-4 text-[#E5B84B] absolute left-3.5 top-3.5" />
                                    <input
                                        id="citizen-password"
                                        name="password"
                                        type="password"
                                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                        minLength={6}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-white/15 bg-[#070E17]/90 pl-10 pr-4 py-3 text-sm text-white placeholder-[#5D728A] focus:border-[#E5B84B] focus:outline-none"
                                    />
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div className="rounded-xl border border-[#E5B84B]/25 bg-[#E5B84B]/10 p-3 flex items-center gap-3 text-xs text-[#F4EFE6]">
                                    <Sparkles className="w-4 h-4 text-[#E5B84B] shrink-0" />
                                    <span>
                                        Includes <strong>£25,000</strong> Royal Bank starter grant, PandoraPhone OS, and full access to London townhouses & stores.
                                    </span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoadingAuth}
                                className="w-full rounded-xl bg-gradient-to-r from-[#E5B84B] to-[#C89629] py-3.5 text-sm font-bold text-[#081019] shadow-lg shadow-[#E5B84B]/20 hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {isLoadingAuth
                                    ? 'Contacting Whitehall Registry...'
                                    : mode === 'register'
                                      ? 'Issue Citizen Passport & Send OTP'
                                      : 'Enter Pandora'}
                            </button>
                        </form>
                    </div>
                )}

                {authStep === 'otp' && (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-[#E5B84B] font-semibold mb-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Step 2 of 3 — Royal Post OTP Verification</span>
                        </div>

                        {devOtpCode && (
                            <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-100">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-emerald-300">
                                        Royal Post Dispatch (Instant Preview)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setOtpValue(devOtpCode)}
                                        className="rounded-lg bg-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-400/30 transition"
                                    >
                                        Auto-Fill {devOtpCode}
                                    </button>
                                </div>
                                <p className="mt-1 font-mono text-base font-bold tracking-widest text-white">
                                    Code: {devOtpCode}
                                </p>
                            </div>
                        )}

                        <form
                            ref={otpFormRef}
                            id="otp-form"
                            action="/v1/account/verify-otp"
                            method="POST"
                            onSubmit={handleOtpSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="otp-input"
                                    className="block text-xs font-semibold text-[#F4EFE6] mb-1"
                                >
                                    6-Digit Verification Code
                                </label>
                                <p id="otp-format-hint" className="text-xs text-[#9FB1C6] mb-2">
                                    Enter the 6-digit code sent to <strong className="text-white">{pendingEmail}</strong>.
                                </p>
                                <input
                                    type="text"
                                    id="otp-input"
                                    name="otp"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="\d{6}"
                                    maxLength={6}
                                    aria-describedby="otp-format-hint"
                                    required
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full rounded-xl border border-[#E5B84B]/40 bg-[#070E17] text-center text-white focus:border-[#E5B84B] focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoadingAuth || otpValue.length !== 6}
                                className="w-full rounded-xl bg-gradient-to-r from-[#E5B84B] to-[#C89629] py-3.5 text-sm font-bold text-[#081019] shadow-lg shadow-[#E5B84B]/20 hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {isLoadingAuth ? 'Verifying Seal...' : 'Verify 6-Digit Code'}
                            </button>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isLoadingAuth}
                                    className="inline-flex items-center gap-1.5 text-xs text-[#E5B84B] hover:underline"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Resend Verification Code
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {authStep === 'username' && (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-3">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Step 3 of 3 — Claim Unique Citizen Identity</span>
                        </div>

                        <form onSubmit={handleUsernameSubmit} method="POST" className="space-y-4">
                            <div>
                                <label
                                    htmlFor="citizen-username"
                                    className="block text-xs font-semibold text-[#F4EFE6] mb-1"
                                >
                                    Unique Pandora Handle (@username)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-3 text-sm font-bold text-[#E5B84B]">@</span>
                                    <input
                                        id="citizen-username"
                                        name="username"
                                        type="text"
                                        required
                                        minLength={3}
                                        maxLength={24}
                                        pattern="^[a-zA-Z0-9_]+$"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())
                                        }
                                        placeholder="lord_kensington"
                                        className="w-full rounded-xl border border-white/15 bg-[#070E17] pl-8 pr-4 py-3 text-sm text-white focus:border-[#E5B84B] focus:outline-none font-mono"
                                    />
                                </div>
                                <p className="text-[11px] text-[#8FA4BC] mt-1">
                                    Used for RoyalPay bank transfers, property deeds, and PandoraPhone SMS.
                                </p>
                            </div>

                            <div>
                                <span className="block text-xs font-semibold text-[#F4EFE6] mb-2">
                                    Tailored Coat Colour
                                </span>
                                <div className="grid grid-cols-6 gap-2">
                                    {AVATAR_COLORS.map((c) => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            title={c.label}
                                            onClick={() => setAvatarColor(c.hex)}
                                            className={`h-9 rounded-xl border-2 transition-transform ${
                                                avatarColor === c.hex
                                                    ? 'border-white scale-110 shadow-lg'
                                                    : 'border-transparent opacity-75 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: c.hex }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="block text-xs font-semibold text-[#F4EFE6] mb-2">
                                    Headwear Style
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                    {HAT_STYLES.map((h) => (
                                        <button
                                            key={h.id}
                                            type="button"
                                            onClick={() => setHatStyle(h.id)}
                                            className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                                                hatStyle === h.id
                                                    ? 'border-[#E5B84B] bg-[#E5B84B]/20 text-white'
                                                    : 'border-white/10 bg-[#070E17]/70 text-[#9FB1C6] hover:text-white'
                                            }`}
                                        >
                                            {h.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="citizen-bio"
                                    className="block text-xs font-semibold text-[#F4EFE6] mb-1"
                                >
                                    Citizen Title / Motto
                                </label>
                                <input
                                    id="citizen-bio"
                                    name="bio"
                                    type="text"
                                    maxLength={120}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full rounded-xl border border-white/15 bg-[#070E17] px-3.5 py-2.5 text-xs text-white focus:border-[#E5B84B] focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoadingAuth || username.length < 3}
                                className="w-full rounded-xl bg-gradient-to-r from-[#E5B84B] to-[#C89629] py-3.5 text-sm font-bold text-[#081019] shadow-lg shadow-[#E5B84B]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <UserCheck className="w-4 h-4" />
                                {isLoadingAuth ? 'Minting Citizen Deed...' : 'Enter the Streets of Pandora'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#788EA7]">
                    <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#E5B84B]" />
                        Powered by DolphJS v3 + Three.js
                    </span>
                    <span>Fastify · Socket.IO · Redis</span>
                </div>
            </div>
        </div>
    );
};

