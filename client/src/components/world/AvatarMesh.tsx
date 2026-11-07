import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarMeshProps {
    username: string;
    avatarColor: string;
    hatStyle: string;
    position: [number, number, number];
    rotationY: number;
    isLocal?: boolean;
    isMoving?: boolean;
    speechText?: string;
}

export const AvatarMesh: React.FC<AvatarMeshProps> = ({
    username,
    avatarColor,
    hatStyle,
    position,
    rotationY,
    isLocal = false,
    isMoving = false,
    speechText,
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Mesh>(null);
    const rightLegRef = useRef<THREE.Mesh>(null);
    const leftArmRef = useRef<THREE.Mesh>(null);
    const rightArmRef = useRef<THREE.Mesh>(null);
    const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const currentRot = useRef(rotationY);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const targetVec = new THREE.Vector3(position[0], position[1], position[2]);
        const dist = currentPos.current.distanceTo(targetVec);

        if (isLocal) {
            currentPos.current.copy(targetVec);
            currentRot.current = rotationY;
        } else {
            currentPos.current.lerp(targetVec, Math.min(1, delta * 12));
            let diff = rotationY - currentRot.current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            currentRot.current += diff * Math.min(1, delta * 12);
        }

        groupRef.current.position.copy(currentPos.current);
        groupRef.current.rotation.y = currentRot.current;

        const movingNow = isLocal ? isMoving : dist > 0.02;
        const t = state.clock.getElapsedTime() * 10;

        if (leftLegRef.current && rightLegRef.current && leftArmRef.current && rightArmRef.current) {
            const swing = movingNow ? Math.sin(t) * 0.55 : 0;
            leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, swing, 0.25);
            rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -swing, 0.25);
            leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -swing * 0.7, 0.25);
            rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, swing * 0.7, 0.25);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {isLocal && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                    <ringGeometry args={[0.55, 0.72, 32]} />
                    <meshBasicMaterial color="#E5B84B" transparent opacity={0.75} />
                </mesh>
            )}

            <mesh ref={leftLegRef} position={[-0.16, 0.38, 0]} castShadow>
                <capsuleGeometry args={[0.11, 0.42, 6, 12]} />
                <meshStandardMaterial color="#1A2433" roughness={0.7} />
            </mesh>
            <mesh ref={rightLegRef} position={[0.16, 0.38, 0]} castShadow>
                <capsuleGeometry args={[0.11, 0.42, 6, 12]} />
                <meshStandardMaterial color="#1A2433" roughness={0.7} />
            </mesh>

            <mesh position={[0, 1.02, 0]} castShadow>
                <capsuleGeometry args={[0.28, 0.48, 8, 16]} />
                <meshStandardMaterial color={avatarColor} roughness={0.45} metalness={0.1} />
            </mesh>

            <mesh position={[0, 1.24, 0.22]} castShadow>
                <boxGeometry args={[0.16, 0.28, 0.08]} />
                <meshStandardMaterial color="#F4EFE6" roughness={0.4} />
            </mesh>

            <mesh ref={leftArmRef} position={[-0.38, 1.02, 0]} castShadow>
                <capsuleGeometry args={[0.09, 0.42, 6, 12]} />
                <meshStandardMaterial color={avatarColor} roughness={0.5} />
            </mesh>
            <mesh ref={rightArmRef} position={[0.38, 1.02, 0]} castShadow>
                <capsuleGeometry args={[0.09, 0.42, 6, 12]} />
                <meshStandardMaterial color={avatarColor} roughness={0.5} />
            </mesh>

            <mesh position={[0, 1.62, 0]} castShadow>
                <sphereGeometry args={[0.26, 20, 20]} />
                <meshStandardMaterial color="#F2D2B6" roughness={0.5} />
            </mesh>

            <mesh position={[-0.09, 1.66, 0.23]}>
                <sphereGeometry args={[0.032, 8, 8]} />
                <meshBasicMaterial color="#0B1522" />
            </mesh>
            <mesh position={[0.09, 1.66, 0.23]}>
                <sphereGeometry args={[0.032, 8, 8]} />
                <meshBasicMaterial color="#0B1522" />
            </mesh>

            {hatStyle === 'bowler' && (
                <group position={[0, 1.84, 0]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.36, 0.36, 0.04, 20]} />
                        <meshStandardMaterial color="#181C24" roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <sphereGeometry args={[0.24, 16, 16]} />
                        <meshStandardMaterial color="#181C24" roughness={0.4} />
                    </mesh>
                </group>
            )}

            {hatStyle === 'tophat' && (
                <group position={[0, 1.84, 0]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.38, 0.38, 0.04, 24]} />
                        <meshStandardMaterial color="#111318" roughness={0.3} metalness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.22, 0]} castShadow>
                        <cylinderGeometry args={[0.25, 0.23, 0.42, 24]} />
                        <meshStandardMaterial color="#111318" roughness={0.3} metalness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.06, 0]}>
                        <cylinderGeometry args={[0.242, 0.242, 0.05, 24]} />
                        <meshStandardMaterial color="#E5B84B" metalness={0.6} roughness={0.3} />
                    </mesh>
                </group>
            )}

            {hatStyle === 'crown' && (
                <group position={[0, 1.86, 0]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.26, 0.23, 0.22, 8]} />
                        <meshStandardMaterial color="#E5B84B" metalness={0.85} roughness={0.18} />
                    </mesh>
                    <mesh position={[0, 0.12, 0]}>
                        <sphereGeometry args={[0.08, 12, 12]} />
                        <meshStandardMaterial color="#C0392B" roughness={0.3} />
                    </mesh>
                </group>
            )}

            {hatStyle === 'cap' && (
                <group position={[0, 1.84, 0.04]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.27, 0.26, 0.1, 16]} />
                        <meshStandardMaterial color="#4A5568" roughness={0.7} />
                    </mesh>
                    <mesh position={[0, -0.02, 0.18]}>
                        <boxGeometry args={[0.34, 0.03, 0.22]} />
                        <meshStandardMaterial color="#2D3748" roughness={0.7} />
                    </mesh>
                </group>
            )}

            <Html position={[0, 2.38, 0]} center distanceFactor={18} zIndexRange={[10, 0]}>
                <div className="pointer-events-none flex flex-col items-center gap-1">
                    {speechText && (
                        <div className="max-w-[200px] rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#081019] shadow-lg border border-[#E5B84B]">
                            {speechText}
                        </div>
                    )}
                    <div
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold whitespace-nowrap shadow-md border ${
                            isLocal
                                ? 'bg-[#E5B84B] text-[#081019] border-white/60'
                                : 'bg-[#081019]/90 text-[#F4EFE6] border-[#E5B84B]/40'
                        }`}
                    >
                        @{username}
                    </div>
                </div>
            </Html>
        </group>
    );
};

