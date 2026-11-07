import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { usePandoraStore } from '../../store/usePandoraStore';
import { NearbyPortal } from '../../types/pandora';
import { AvatarMesh } from './AvatarMesh';
import { BuildingInteriorScene } from './BuildingInteriorScene';
import { PandoraExteriorScene } from './PandoraExteriorScene';

const ActiveControllerAndCamera: React.FC<{
    onMovingChange: (moving: boolean) => void;
}> = ({ onMovingChange }) => {
    const { camera } = useThree();
    const keysPressed = useRef<Record<string, boolean>>({});
    const cameraYaw = useRef<number>(0);
    const isDragging = useRef<boolean>(false);
    const lastMouseX = useRef<number>(0);
    const wasMoving = useRef<boolean>(false);

    useEffect(() => {
        const isInputFocused = () => {
            const el = document.activeElement;
            if (!el) return false;
            const tag = el.tagName.toLowerCase();
            return tag === 'input' || tag === 'textarea' || tag === 'select';
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isInputFocused()) return;
            const k = e.key.toLowerCase();
            keysPressed.current[k] = true;

            if (k === 'e') {
                const state = usePandoraStore.getState();
                if (state.currentZone !== 'exterior') {
                    state.exitBuildingToStreet();
                } else if (state.nearbyPortal) {
                    if (state.nearbyPortal.kind === 'house') {
                        state.enterHouse(state.nearbyPortal.id);
                    } else {
                        state.enterStoreBuilding(state.nearbyPortal.id);
                    }
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0 || e.button === 2) {
                isDragging.current = true;
                lastMouseX.current = e.clientX;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = e.clientX - lastMouseX.current;
            lastMouseX.current = e.clientX;
            cameraYaw.current -= dx * 0.0055;
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useFrame((_, delta) => {
        const state = usePandoraStore.getState();
        const [px, py, pz] = state.localPosition;
        let rotY = state.localRotationY;

        const k = keysPressed.current;
        if (k['q']) cameraYaw.current += delta * 1.8;
        if (k['r']) cameraYaw.current -= delta * 1.8;

        let forward = 0;
        let strafe = 0;

        if (k['w'] || k['arrowup']) forward += 1;
        if (k['s'] || k['arrowdown']) forward -= 1;
        if (k['a'] || k['arrowleft']) strafe -= 1;
        if (k['d'] || k['arrowright']) strafe += 1;

        const isMoving = forward !== 0 || strafe !== 0;
        if (isMoving !== wasMoving.current) {
            wasMoving.current = isMoving;
            onMovingChange(isMoving);
        }

        let nextX = px;
        let nextZ = pz;

        if (isMoving) {
            const speed = k['shift'] ? 14 : 9.2;
            const moveAngle = Math.atan2(strafe, forward) + cameraYaw.current;
            nextX += Math.sin(moveAngle) * speed * delta;
            nextZ -= Math.cos(moveAngle) * speed * delta;
            rotY = Math.atan2(Math.sin(moveAngle), -Math.cos(moveAngle));

            const bound = state.currentZone === 'exterior' ? 95 : 6.6;
            nextX = Math.max(-bound, Math.min(bound, nextX));
            nextZ = Math.max(-bound, Math.min(bound, nextZ));

            state.updateLocalTransform(nextX, py, nextZ, rotY);
        }

        if (state.currentZone === 'exterior') {
            let closest: NearbyPortal | null = null;
            let minDist = 4.6;

            for (const prop of state.properties) {
                const doorZ = prop.posZ < 0 ? prop.posZ + prop.depth / 2 + 1.5 : prop.posZ - prop.depth / 2 - 1.5;
                const d = Math.hypot(nextX - prop.posX, nextZ - doorZ);
                if (d < minDist) {
                    minDist = d;
                    closest = {
                        kind: 'house',
                        id: prop.id,
                        name: prop.name,
                        subtitle: `${prop.district} · ${prop.address}`,
                        price: prop.price,
                        isForSale: prop.isForSale,
                        isLocked: prop.isLocked,
                        ownerUsername: prop.ownerUsername,
                        ownerId: prop.ownerId,
                    };
                }
            }

            for (const store of state.stores) {
                const doorZ = store.posZ < 0 ? store.posZ + 6.0 : store.posZ - 6.0;
                const d = Math.hypot(nextX - store.posX, nextZ - doorZ);
                if (d < minDist) {
                    minDist = d;
                    closest = {
                        kind: 'store',
                        id: store.slug,
                        name: store.name,
                        subtitle: store.subtitle,
                    };
                }
            }

            const prevId = state.nearbyPortal?.id ?? null;
            const nextId = closest?.id ?? null;
            if (prevId !== nextId) {
                state.setNearbyPortal(closest);
            }
        }

        const camDist = state.currentZone === 'exterior' ? 11.5 : 8.2;
        const camHeight = state.currentZone === 'exterior' ? 6.2 : 4.8;
        const desiredCamX = nextX - Math.sin(cameraYaw.current) * camDist;
        const desiredCamZ = nextZ + Math.cos(cameraYaw.current) * camDist;

        camera.position.lerp(new THREE.Vector3(desiredCamX, py + camHeight, desiredCamZ), Math.min(1, delta * 9));
        camera.lookAt(nextX, py + 1.5, nextZ);
    });

    return null;
};

export const PandoraCanvas: React.FC = () => {
    const {
        account,
        currentZone,
        localPosition,
        localRotationY,
        remotePlayers,
        headBubbles,
        timeOfDay,
    } = usePandoraStore();

    const [isLocalMoving, setIsLocalMoving] = useState(false);

    const skyBg =
        timeOfDay === 'day'
            ? '#386FA4'
            : timeOfDay === 'dusk'
              ? '#111E32'
              : '#050A12';

    const ambientIntensity =
        timeOfDay === 'day' ? 1.05 : timeOfDay === 'dusk' ? 0.65 : 0.42;

    const sunColor =
        timeOfDay === 'day' ? '#FFFBEB' : timeOfDay === 'dusk' ? '#FDBA74' : '#93C5FD';

    const now = Date.now();
    const myBubble =
        account && headBubbles[account.id] && headBubbles[account.id].expiresAt > now
            ? headBubbles[account.id].text
            : undefined;

    return (
        <div className="fixed inset-0 z-0">
            <Canvas
                shadows
                camera={{ position: [0, 7, 32], fov: 52, near: 0.1, far: 350 }}
                gl={{ antialias: true }}
            >
                <color attach="background" args={[skyBg]} />
                <fog attach="fog" args={[skyBg, 42, 165]} />

                <ambientLight intensity={ambientIntensity} color={sunColor} />
                <directionalLight
                    castShadow
                    position={[35, 55, 25]}
                    intensity={timeOfDay === 'day' ? 1.5 : 0.95}
                    color={sunColor}
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />

                {timeOfDay !== 'day' && (
                    <Stars radius={120} depth={45} count={2500} factor={4} saturation={0} fade speed={0.8} />
                )}

                <ActiveControllerAndCamera onMovingChange={setIsLocalMoving} />

                {currentZone === 'exterior' ? <PandoraExteriorScene /> : <BuildingInteriorScene />}

                {account && (
                    <AvatarMesh
                        username={account.username || 'citizen'}
                        avatarColor={account.avatarColor}
                        hatStyle={account.hatStyle}
                        position={localPosition}
                        rotationY={localRotationY}
                        isLocal
                        isMoving={isLocalMoving}
                        speechText={myBubble}
                    />
                )}

                {Object.values(remotePlayers).map((player) => {
                    const bubble =
                        headBubbles[player.accountId] && headBubbles[player.accountId].expiresAt > now
                            ? headBubbles[player.accountId].text
                            : undefined;
                    return (
                        <AvatarMesh
                            key={player.accountId}
                            username={player.username}
                            avatarColor={player.avatarColor}
                            hatStyle={player.hatStyle}
                            position={[player.x, player.y, player.z]}
                            rotationY={player.rotationY}
                            speechText={bubble}
                        />
                    );
                })}
            </Canvas>
        </div>
    );
};

