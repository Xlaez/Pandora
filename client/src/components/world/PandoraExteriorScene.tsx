import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePandoraStore } from '../../store/usePandoraStore';
import { PandoraStore, Property } from '../../types/pandora';

const ClockTower: React.FC = () => {
    return (
        <group position={[0, 0, 0]}>
            <mesh position={[0, 0.35, 0]} receiveShadow>
                <cylinderGeometry args={[8.5, 9.2, 0.7, 32]} />
                <meshStandardMaterial color="#2D3748" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.8, 0]} receiveShadow>
                <cylinderGeometry args={[4.8, 5.2, 0.4, 24]} />
                <meshStandardMaterial color="#D6CEC2" roughness={0.6} />
            </mesh>

            <mesh position={[0, 9.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[4.4, 18, 4.4]} />
                <meshStandardMaterial color="#C8BCA8" roughness={0.55} />
            </mesh>

            {[-2.15, 2.15].map((cx) =>
                [-2.15, 2.15].map((cz) => (
                    <mesh key={`${cx}-${cz}`} position={[cx, 9.5, cz]} castShadow>
                        <boxGeometry args={[0.45, 18.4, 0.45]} />
                        <meshStandardMaterial color="#E5B84B" metalness={0.45} roughness={0.35} />
                    </mesh>
                )),
            )}

            <mesh position={[0, 19.6, 0]} castShadow>
                <boxGeometry args={[5.1, 3.4, 5.1]} />
                <meshStandardMaterial color="#D8CEBE" roughness={0.45} />
            </mesh>

            {[
                [0, 19.6, 2.58, 0],
                [0, 19.6, -2.58, Math.PI],
                [2.58, 19.6, 0, Math.PI / 2],
                [-2.58, 19.6, 0, -Math.PI / 2],
            ].map(([x, y, z, rot], idx) => (
                <group key={idx} position={[x, y, z]} rotation={[0, rot, 0]}>
                    <mesh>
                        <circleGeometry args={[1.35, 32]} />
                        <meshBasicMaterial color="#FFFDF5" />
                    </mesh>
                    <mesh position={[0, 0, 0.02]}>
                        <ringGeometry args={[1.22, 1.38, 32]} />
                        <meshBasicMaterial color="#D4AF37" />
                    </mesh>
                    <mesh position={[0, 0.32, 0.03]}>
                        <boxGeometry args={[0.1, 0.72, 0.02]} />
                        <meshBasicMaterial color="#0B1522" />
                    </mesh>
                    <mesh position={[0.25, 0, 0.03]} rotation={[0, 0, -Math.PI / 3]}>
                        <boxGeometry args={[0.08, 0.56, 0.02]} />
                        <meshBasicMaterial color="#0B1522" />
                    </mesh>
                </group>
            ))}

            <mesh position={[0, 23.8, 0]} castShadow>
                <coneGeometry args={[3.5, 5.4, 4]} />
                <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, 26.9, 0]}>
                <sphereGeometry args={[0.38, 16, 16]} />
                <meshBasicMaterial color="#F5D061" />
            </mesh>
            <pointLight position={[0, 21, 0]} intensity={2.2} distance={38} color="#F5D061" />
        </group>
    );
};

const DoubleDeckerBus: React.FC = () => {
    const busRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!busRef.current) return;
        const t = state.clock.getElapsedTime();
        const x = Math.sin(t * 0.22) * 72;
        const dir = Math.cos(t * 0.22) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        busRef.current.position.set(x, 0, -3.5);
        busRef.current.rotation.y = dir;
    });

    return (
        <group ref={busRef} position={[0, 0, -3.5]}>
            <mesh position={[0, 1.45, 0]} castShadow>
                <boxGeometry args={[2.3, 2.3, 6.2]} />
                <meshStandardMaterial color="#B91C1C" roughness={0.35} metalness={0.15} />
            </mesh>
            <mesh position={[0, 2.75, -0.2]} castShadow>
                <boxGeometry args={[2.22, 1.5, 5.6]} />
                <meshStandardMaterial color="#DC2626" roughness={0.35} metalness={0.15} />
            </mesh>
            <mesh position={[0, 2.02, 0]}>
                <boxGeometry args={[2.34, 0.12, 6.24]} />
                <meshBasicMaterial color="#F4EFE6" />
            </mesh>
            <mesh position={[0, 1.6, 3.12]}>
                <planeGeometry args={[1.9, 0.85]} />
                <meshBasicMaterial color="#E0F2FE" />
            </mesh>
            {[-1.9, 1.9].map((z) =>
                [-1.1, 1.1].map((x) => (
                    <mesh key={`${x}-${z}`} position={[x, 0.42, z]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.42, 0.42, 0.26, 16]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                )),
            )}
        </group>
    );
};

const StreetLamp: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <mesh position={[0, 2.1, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, 4.2, 10]} />
            <meshStandardMaterial color="#1A202C" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.35, 0]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshBasicMaterial color="#FDE68A" />
        </mesh>
    </group>
);

const RedPhoneBooth: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <mesh position={[0, 1.25, 0]} castShadow>
            <boxGeometry args={[1.05, 2.5, 1.05]} />
            <meshStandardMaterial color="#B91C1C" roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.6, 0]} castShadow>
            <sphereGeometry args={[0.62, 12, 12]} />
            <meshStandardMaterial color="#991B1B" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.3, 0.54]}>
            <planeGeometry args={[0.7, 1.8]} />
            <meshBasicMaterial color="#FEF08A" transparent opacity={0.65} />
        </mesh>
    </group>
);

const HouseMesh: React.FC<{
    property: Property;
    currentAccountId: string | undefined;
    onEnter: (id: string) => void;
    onInspect: (id: string) => void;
}> = ({ property, currentAccountId, onEnter, onInspect }) => {
    const height = property.floors * 2.8;
    const isOwnedByMe = Boolean(currentAccountId && property.ownerId === currentAccountId);
    const doorOffsetZ = property.posZ < 0 ? property.depth / 2 + 0.08 : -(property.depth / 2 + 0.08);
    const doorRotY = property.posZ < 0 ? 0 : Math.PI;

    return (
        <group position={[property.posX, 0, property.posZ]}>
            <mesh position={[0, 0.2, 0]} receiveShadow>
                <boxGeometry args={[property.width + 1.2, 0.4, property.depth + 1.2]} />
                <meshStandardMaterial color="#CBD5E1" roughness={0.8} />
            </mesh>

            <mesh
                position={[0, height / 2 + 0.4, 0]}
                castShadow
                receiveShadow
                onClick={(e) => {
                    e.stopPropagation();
                    onInspect(property.id);
                }}
            >
                <boxGeometry args={[property.width, height, property.depth]} />
                <meshStandardMaterial color={property.facadeColor} roughness={0.62} />
            </mesh>

            {Array.from({ length: property.floors }).map((_, floorIdx) => {
                const y = 1.9 + floorIdx * 2.7;
                return (
                    <group key={floorIdx}>
                        {[-property.width * 0.28, 0, property.width * 0.28].map((wx, wIdx) => {
                            if (floorIdx === 0 && wIdx === 1) return null;
                            return (
                                <mesh
                                    key={wIdx}
                                    position={[wx, y, doorOffsetZ]}
                                    rotation={[0, doorRotY, 0]}
                                >
                                    <planeGeometry args={[1.15, 1.55]} />
                                    <meshBasicMaterial color="#FDE68A" />
                                </mesh>
                            );
                        })}
                    </group>
                );
            })}

            <mesh position={[0, height + 0.55, 0]} castShadow>
                <boxGeometry args={[property.width + 0.5, 0.45, property.depth + 0.5]} />
                <meshStandardMaterial color={property.trimColor} roughness={0.5} />
            </mesh>

            {property.roofStyle === 'mansard' && (
                <mesh position={[0, height + 1.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[property.width * 0.72, 2.2, 4]} />
                    <meshStandardMaterial color="#1E293B" roughness={0.6} />
                </mesh>
            )}

            {property.roofStyle === 'gable' && (
                <mesh position={[0, height + 1.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[property.width * 0.75, 2.5, 4]} />
                    <meshStandardMaterial color="#334155" roughness={0.65} />
                </mesh>
            )}

            <group position={[0, 0, doorOffsetZ]} rotation={[0, doorRotY, 0]}>
                <mesh position={[-1.1, 1.5, 0.35]} castShadow>
                    <cylinderGeometry args={[0.16, 0.18, 2.8, 12]} />
                    <meshStandardMaterial color={property.trimColor} />
                </mesh>
                <mesh position={[1.1, 1.5, 0.35]} castShadow>
                    <cylinderGeometry args={[0.16, 0.18, 2.8, 12]} />
                    <meshStandardMaterial color={property.trimColor} />
                </mesh>
                <mesh position={[0, 2.95, 0.4]}>
                    <boxGeometry args={[2.7, 0.32, 0.9]} />
                    <meshStandardMaterial color={property.trimColor} />
                </mesh>

                <mesh
                    position={[0, 1.45, 0.05]}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEnter(property.id);
                    }}
                >
                    <boxGeometry args={[1.45, 2.4, 0.14]} />
                    <meshStandardMaterial
                        color={isOwnedByMe ? '#10B981' : property.isLocked ? '#EF4444' : '#E5B84B'}
                        metalness={0.35}
                        roughness={0.3}
                    />
                </mesh>

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 1.5]}>
                    <ringGeometry args={[0.9, 1.25, 24]} />
                    <meshBasicMaterial
                        color={isOwnedByMe ? '#10B981' : property.isForSale ? '#E5B84B' : '#60A5FA'}
                        transparent
                        opacity={0.75}
                    />
                </mesh>
            </group>

            <Html position={[0, height + 2.8, 0]} center distanceFactor={28} zIndexRange={[10, 0]}>
                <div
                    onClick={() => onInspect(property.id)}
                    className="cursor-pointer select-none rounded-xl border border-[#E5B84B]/40 bg-[#081019]/90 px-3 py-1.5 text-center shadow-xl backdrop-blur-md hover:scale-105 transition"
                >
                    <div className="text-[10px] uppercase tracking-wider text-[#E5B84B] font-bold">
                        {property.district}
                    </div>
                    <div className="text-xs font-bold text-white whitespace-nowrap">
                        {property.name}
                    </div>
                    <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-mono">
                        {property.ownerUsername ? (
                            <span className={isOwnedByMe ? 'text-emerald-400 font-bold' : 'text-sky-300'}>
                                {isOwnedByMe ? '★ Your Residence' : `Owned by @${property.ownerUsername}`}
                            </span>
                        ) : (
                            <span className="text-[#E5B84B] font-bold">
                                For Sale · £{property.price.toLocaleString()}
                            </span>
                        )}
                        {property.isLocked && <span className="text-red-400">🔒</span>}
                    </div>
                </div>
            </Html>
        </group>
    );
};

const StoreBuildingMesh: React.FC<{
    store: PandoraStore;
    onEnterStore: (slug: string) => void;
}> = ({ store, onEnterStore }) => {
    const doorOffsetZ = store.posZ < 0 ? 4.6 : -4.6;
    const doorRotY = store.posZ < 0 ? 0 : Math.PI;

    return (
        <group position={[store.posX, 0, store.posZ]}>
            <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[9.5, 8.4, 9]} />
                <meshStandardMaterial color={store.facadeColor} roughness={0.5} />
            </mesh>

            <mesh position={[0, 8.6, 0]} castShadow>
                <boxGeometry args={[10.1, 0.5, 9.6]} />
                <meshStandardMaterial color={store.accentColor} metalness={0.5} roughness={0.3} />
            </mesh>

            <group position={[0, 0, doorOffsetZ]} rotation={[0, doorRotY, 0]}>
                <mesh position={[-2.6, 1.8, 0.05]}>
                    <planeGeometry args={[2.2, 2.4]} />
                    <meshBasicMaterial color="#FEF08A" />
                </mesh>
                <mesh position={[2.6, 1.8, 0.05]}>
                    <planeGeometry args={[2.2, 2.4]} />
                    <meshBasicMaterial color="#FEF08A" />
                </mesh>

                <mesh
                    position={[0, 1.6, 0.08]}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEnterStore(store.slug);
                    }}
                >
                    <boxGeometry args={[1.8, 2.8, 0.16]} />
                    <meshStandardMaterial color={store.accentColor} metalness={0.5} roughness={0.25} />
                </mesh>

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 1.6]}>
                    <ringGeometry args={[1.0, 1.4, 24]} />
                    <meshBasicMaterial color="#34D399" transparent opacity={0.85} />
                </mesh>
            </group>

            <Html position={[0, 10.2, 0]} center distanceFactor={26} zIndexRange={[10, 0]}>
                <button
                    type="button"
                    onClick={() => onEnterStore(store.slug)}
                    className="cursor-pointer rounded-xl border-2 border-[#E5B84B] bg-[#081019]/95 px-3.5 py-1.5 text-center shadow-xl hover:scale-105 transition"
                >
                    <div className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                        OPEN STORE · CLICK TO ENTER
                    </div>
                    <div className="font-display text-xs font-bold text-[#F4EFE6] whitespace-nowrap">
                        {store.name}
                    </div>
                </button>
            </Html>
        </group>
    );
};

export const PandoraExteriorScene: React.FC = () => {
    const {
        properties,
        stores,
        account,
        enterHouse,
        enterStoreBuilding,
        setSelectedPropertyId,
        setPhoneOpen,
    } = usePandoraStore();

    const streetLampCoords = useMemo<[number, number, number][]>(
        () => [
            [-12, 0, -6.5],
            [12, 0, -6.5],
            [-32, 0, -6.5],
            [32, 0, -6.5],
            [-55, 0, -6.5],
            [55, 0, -6.5],
            [-12, 0, 6.5],
            [12, 0, 6.5],
            [-32, 0, 6.5],
            [32, 0, 6.5],
            [-55, 0, 6.5],
            [55, 0, 6.5],
            [-6.5, 0, -25],
            [6.5, 0, -25],
            [-6.5, 0, 25],
            [6.5, 0, 25],
        ],
        [],
    );

    const handleInspectProperty = (propertyId: string) => {
        setSelectedPropertyId(propertyId);
        setPhoneOpen(true, 'realty');
    };

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <planeGeometry args={[260, 260]} />
                <meshStandardMaterial color="#1B3024" roughness={0.9} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <planeGeometry args={[180, 12]} />
                <meshStandardMaterial color="#1E2631" roughness={0.85} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
                <planeGeometry args={[12, 160]} />
                <meshStandardMaterial color="#1E2631" roughness={0.85} />
            </mesh>

            {[-26, -46, -66, 26, 46, 66].map((xCoord) => (
                <mesh key={xCoord} rotation={[-Math.PI / 2, 0, 0]} position={[xCoord, 0.011, 0]} receiveShadow>
                    <planeGeometry args={[6.5, 64]} />
                    <meshStandardMaterial color="#252F3D" roughness={0.85} />
                </mesh>
            ))}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                <circleGeometry args={[15, 48]} />
                <meshStandardMaterial color="#334155" roughness={0.75} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -52]}>
                <planeGeometry args={[260, 18]} />
                <meshStandardMaterial color="#0D3B66" metalness={0.65} roughness={0.2} />
            </mesh>

            <group position={[0, 0.3, -52]}>
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[14, 0.7, 20]} />
                    <meshStandardMaterial color="#94A3B8" roughness={0.6} />
                </mesh>
                <mesh position={[-6.6, 1.1, 0]} castShadow>
                    <boxGeometry args={[0.6, 1.5, 20]} />
                    <meshStandardMaterial color="#E5B84B" metalness={0.5} roughness={0.3} />
                </mesh>
                <mesh position={[6.6, 1.1, 0]} castShadow>
                    <boxGeometry args={[0.6, 1.5, 20]} />
                    <meshStandardMaterial color="#E5B84B" metalness={0.5} roughness={0.3} />
                </mesh>
            </group>

            <ClockTower />
            <DoubleDeckerBus />

            <RedPhoneBooth position={[-9.5, 0, 9.5]} />
            <RedPhoneBooth position={[9.5, 0, -9.5]} />

            {streetLampCoords.map((pos, idx) => (
                <StreetLamp key={idx} position={pos} />
            ))}

            {properties.map((prop) => (
                <HouseMesh
                    key={prop.id}
                    property={prop}
                    currentAccountId={account?.id}
                    onEnter={enterHouse}
                    onInspect={handleInspectProperty}
                />
            ))}

            {stores.map((store) => (
                <StoreBuildingMesh
                    key={store.slug}
                    store={store}
                    onEnterStore={enterStoreBuilding}
                />
            ))}
        </group>
    );
};

