import React, { useEffect } from 'react';
import { AuthOverlay } from './components/AuthOverlay';
import { CityHud } from './components/CityHud';
import { PandoraPhone } from './components/PandoraPhone';
import { PandoraCanvas } from './components/world/PandoraCanvas';
import { usePandoraStore } from './store/usePandoraStore';

export const App: React.FC = () => {
    const { authStep, bootstrapSession } = usePandoraStore();

    useEffect(() => {
        bootstrapSession();
    }, [bootstrapSession]);

    return (
        <main className="relative w-screen h-screen overflow-hidden bg-[#070E17] select-none">
            <PandoraCanvas />
            {authStep !== 'ready' ? (
                <AuthOverlay />
            ) : (
                <>
                    <CityHud />
                    <PandoraPhone />
                </>
            )}
        </main>
    );
};

