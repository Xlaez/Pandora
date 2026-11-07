import React from 'react';
import { Html } from '@react-three/drei';
import { usePandoraStore } from '../../store/usePandoraStore';
import { InteriorTheme } from '../../types/pandora';

const THEME_PALETTES: Record<
    InteriorTheme,
    { wall: string; floor: string; rug: string; sofa: string; accent: string; label: string }
> = {
    georgian_velvet: {
        wall: '#2C1810',
        floor: '#4A2E1B',
        rug: '#8B1E1E',
        sofa: '#641E16',
        accent: '#E5B84B',
        label: 'Georgian Velvet Parlour',
    },
    shoreditch_industrial: {
        wall: '#374151',
        floor: '#1F2937',
        rug: '#B45309',
        sofa: '#78350F',
        accent: '#F59E0B',
        label: 'Shoreditch Loft Studio',
    },
    mayfair_marble: {
        wall: '#1E293B',
        floor: '#E2E8F0',
        rug: '#1E3A8A',
        sofa: '#0F172A',
        accent: '#D4AF37',
        label: 'Mayfair Sovereign Marble',
    },
    chelsea_botanical: {
        wall: '#1B4332',
        floor: '#5C4033',
        rug: '#D97706',
        sofa: '#065F46',
        accent: '#A7F3D0',
        label: 'Chelsea Botanical Salon',
    },
};

export const BuildingInteriorScene: React.FC = () => {
    const {
        currentZone,
        properties,
        stores,
        account,
        exitBuildingToStreet,
        buyHouse,
        updateHouseSettings,
        buyStoreItem,
    } = usePandoraStore();

    const isHouse = currentZone.startsWith('house:');
    const isStore = currentZone.startsWith('store:');

    if (isHouse) {
        const propertyId = currentZone.slice('house:'.length);
        const property = properties.find((p) => p.id === propertyId);
        const palette = THEME_PALETTES[property?.interiorTheme ?? 'georgian_velvet'];
        const isOwner = Boolean(account && property && property.ownerId === account.id);

        return (
            <group>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[16, 16]} />
                    <meshStandardMaterial color={palette.floor} roughness={0.5} />
                </mesh>

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -0.5]} receiveShadow>
                    <planeGeometry args={[8.5, 6.5]} />
                    <meshStandardMaterial color={palette.rug} roughness={0.85} />
                </mesh>

                <mesh position={[0, 3.2, -7.8]} receiveShadow>
                    <boxGeometry args={[16, 6.4, 0.4]} />
                    <meshStandardMaterial color={palette.wall} roughness={0.7} />
                </mesh>
                <mesh position={[-7.8, 3.2, 0]} receiveShadow>
                    <boxGeometry args={[0.4, 6.4, 16]} />
                    <meshStandardMaterial color={palette.wall} roughness={0.7} />
                </mesh>
                <mesh position={[7.8, 3.2, 0]} receiveShadow>
                    <boxGeometry args={[0.4, 6.4, 16]} />
                    <meshStandardMaterial color={palette.wall} roughness={0.7} />
                </mesh>

                <group position={[0, 0, -7.2]}>
                    <mesh position={[0, 1.4, 0]} castShadow>
                        <boxGeometry args={[3.2, 2.8, 0.9]} />
                        <meshStandardMaterial color="#D6CEC2" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.85, 0.32]}>
                        <boxGeometry args={[1.6, 1.4, 0.4]} />
                        <meshBasicMaterial color="#F97316" />
                    </mesh>
                    <pointLight position={[0, 1.2, 1.2]} intensity={2.6} distance={14} color="#FDBA74" />
                </group>

                <group position={[0, 0, -1.5]}>
                    <mesh position={[0, 0.55, 0]} castShadow>
                        <boxGeometry args={[4.2, 0.7, 1.5]} />
                        <meshStandardMaterial color={palette.sofa} roughness={0.6} />
                    </mesh>
                    <mesh position={[0, 1.1, -0.55]} castShadow>
                        <boxGeometry args={[4.2, 0.85, 0.4]} />
                        <meshStandardMaterial color={palette.sofa} roughness={0.6} />
                    </mesh>
                    <mesh position={[0, 0.35, 1.8]} castShadow>
                        <boxGeometry args={[2.4, 0.5, 1.1]} />
                        <meshStandardMaterial color={palette.accent} metalness={0.4} roughness={0.35} />
                    </mesh>
                </group>

                <group position={[0, 1.6, 7.5]}>
                    <mesh
                        onClick={(e) => {
                            e.stopPropagation();
                            exitBuildingToStreet();
                        }}
                        castShadow
                    >
                        <boxGeometry args={[2.2, 3.2, 0.25]} />
                        <meshStandardMaterial color="#E5B84B" metalness={0.4} roughness={0.3} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, -1.2]}>
                        <ringGeometry args={[0.9, 1.3, 24]} />
                        <meshBasicMaterial color="#34D399" transparent opacity={0.85} />
                    </mesh>
                    <Html position={[0, 2.2, 0]} center distanceFactor={16} zIndexRange={[10, 0]}>
                        <button
                            type="button"
                            onClick={() => exitBuildingToStreet()}
                            className="rounded-xl bg-[#E5B84B] px-3.5 py-1.5 text-xs font-bold text-[#081019] shadow-lg hover:brightness-110 transition whitespace-nowrap"
                        >
                            Exit to Street (E)
                        </button>
                    </Html>
                </group>

                {property && (
                    <Html position={[0, 4.2, -7.1]} center distanceFactor={15} zIndexRange={[10, 0]}>
                        <div className="w-80 rounded-2xl border border-[#E5B84B]/50 bg-[#081019]/95 p-4 text-center shadow-2xl backdrop-blur-md">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#E5B84B]">
                                {property.district} · {palette.label}
                            </div>
                            <div className="font-display text-base font-bold text-white mt-0.5">
                                {property.name}
                            </div>
                            <div className="text-xs text-[#9FB1C6] mt-1">
                                {property.ownerUsername
                                    ? `Deed Holder: @${property.ownerUsername}`
                                    : `Crown Estate Listing · £${property.price.toLocaleString()}`}
                            </div>

                            {property.isForSale && !isOwner && (
                                <button
                                    type="button"
                                    onClick={() => buyHouse(property.id)}
                                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#E5B84B] to-[#C89629] py-2 text-xs font-bold text-[#081019] shadow hover:brightness-110 transition"
                                >
                                    Purchase Residence for £{property.price.toLocaleString()}
                                </button>
                            )}

                            {isOwner && (
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateHouseSettings(property.id, { isLocked: !property.isLocked })
                                            }
                                            className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                                                property.isLocked
                                                    ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                            }`}
                                        >
                                            {property.isLocked ? '🔒 Doors Locked' : '🔓 Doors Unlocked'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateHouseSettings(property.id, { isForSale: !property.isForSale })
                                            }
                                            className="flex-1 rounded-lg border border-[#E5B84B]/40 bg-[#E5B84B]/15 py-1.5 text-[11px] font-bold text-[#E5B84B]"
                                        >
                                            {property.isForSale ? 'Listed for Sale' : 'List for Sale'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {(
                                            [
                                                ['georgian_velvet', 'Georgian Velvet'],
                                                ['mayfair_marble', 'Mayfair Marble'],
                                                ['shoreditch_industrial', 'Shoreditch Loft'],
                                                ['chelsea_botanical', 'Chelsea Salon'],
                                            ] as [InteriorTheme, string][]
                                        ).map(([themeKey, label]) => (
                                            <button
                                                key={themeKey}
                                                type="button"
                                                onClick={() =>
                                                    updateHouseSettings(property.id, { interiorTheme: themeKey })
                                                }
                                                className={`rounded-lg py-1 text-[10px] font-semibold border ${
                                                    property.interiorTheme === themeKey
                                                        ? 'border-[#E5B84B] bg-[#E5B84B] text-[#081019]'
                                                        : 'border-white/10 bg-white/5 text-[#CBD7E6]'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Html>
                )}
            </group>
        );
    }

    if (isStore) {
        const slug = currentZone.slice('store:'.length);
        const store = stores.find((s) => s.slug === slug);

        return (
            <group>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[18, 18]} />
                    <meshStandardMaterial color="#1E293B" roughness={0.4} />
                </mesh>

                <mesh position={[0, 3.4, -8.5]} receiveShadow>
                    <boxGeometry args={[18, 6.8, 0.4]} />
                    <meshStandardMaterial color={store?.facadeColor ?? '#1B4332'} roughness={0.6} />
                </mesh>
                <mesh position={[-8.8, 3.4, 0]} receiveShadow>
                    <boxGeometry args={[0.4, 6.8, 18]} />
                    <meshStandardMaterial color={store?.facadeColor ?? '#1B4332'} roughness={0.6} />
                </mesh>
                <mesh position={[8.8, 3.4, 0]} receiveShadow>
                    <boxGeometry args={[0.4, 6.8, 18]} />
                    <meshStandardMaterial color={store?.facadeColor ?? '#1B4332'} roughness={0.6} />
                </mesh>

                <mesh position={[0, 0.7, -5.8]} castShadow>
                    <boxGeometry args={[8.5, 1.4, 1.4]} />
                    <meshStandardMaterial color="#78350F" roughness={0.45} />
                </mesh>

                {store?.items.map((item, idx) => {
                    const x = -4.5 + idx * 3.0;
                    return (
                        <group key={item.sku} position={[x, 0, -1.2]}>
                            <mesh position={[0, 0.65, 0]} castShadow>
                                <cylinderGeometry args={[0.65, 0.78, 1.3, 20]} />
                                <meshStandardMaterial color="#E5B84B" metalness={0.55} roughness={0.25} />
                            </mesh>
                            <mesh
                                position={[0, 1.65, 0]}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    buyStoreItem(store.slug, item.sku);
                                }}
                                castShadow
                            >
                                <octahedronGeometry args={[0.42, 0]} />
                                <meshStandardMaterial
                                    color={item.grantsAvatarColor ?? '#38BDF8'}
                                    metalness={0.5}
                                    roughness={0.2}
                                />
                            </mesh>

                            <Html position={[0, 2.65, 0]} center distanceFactor={14} zIndexRange={[10, 0]}>
                                <div className="w-44 rounded-xl border border-[#E5B84B]/50 bg-[#081019]/95 p-2.5 text-center shadow-xl">
                                    <div className="text-xs font-bold text-white">{item.name}</div>
                                    <div className="text-[10px] text-[#9FB1C6] line-clamp-2 mt-0.5">
                                        {item.description}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => buyStoreItem(store.slug, item.sku)}
                                        className="mt-2 w-full rounded-lg bg-[#E5B84B] py-1 text-[11px] font-bold text-[#081019] hover:brightness-110 transition"
                                    >
                                        Buy · £{item.price.toLocaleString()}
                                    </button>
                                </div>
                            </Html>
                        </group>
                    );
                })}

                <group position={[0, 1.6, 7.8]}>
                    <mesh
                        onClick={(e) => {
                            e.stopPropagation();
                            exitBuildingToStreet();
                        }}
                        castShadow
                    >
                        <boxGeometry args={[2.4, 3.2, 0.25]} />
                        <meshStandardMaterial color="#E5B84B" metalness={0.4} roughness={0.3} />
                    </mesh>
                    <Html position={[0, 2.2, 0]} center distanceFactor={16} zIndexRange={[10, 0]}>
                        <button
                            type="button"
                            onClick={() => exitBuildingToStreet()}
                            className="rounded-xl bg-[#E5B84B] px-3.5 py-1.5 text-xs font-bold text-[#081019] shadow-lg hover:brightness-110 transition whitespace-nowrap"
                        >
                            Exit Store to High Street (E)
                        </button>
                    </Html>
                </group>
            </group>
        );
    }

    return null;
};

