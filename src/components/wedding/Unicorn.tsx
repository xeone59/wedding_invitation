import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Center, useGLTF } from '@react-three/drei'
import { damp, dampE } from 'maath/easing'
import { useWeddingMotion } from '../../context/WeddingMotionContext'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

import unicornGltfUrl from '../../assets/Meshy_AI_unicorn_0404173719_texture.glb?url'

useGLTF.preload(unicornGltfUrl)

function enhanceGltfMaterial(
  original: THREE.Material,
): THREE.MeshPhysicalMaterial {
  if (!(original instanceof THREE.MeshStandardMaterial)) {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#fafcff'),
      roughness: 0.12,
      metalness: 0.02,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 1.62,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.15,
    })
    m.toneMapped = false
    return m
  }

  const m = new THREE.MeshPhysicalMaterial({
    map: original.map,
    normalMap: original.normalMap,
    normalScale:
      original.normalScale?.clone() ?? new THREE.Vector2(1, 1),
    roughnessMap: original.roughnessMap,
    metalnessMap: original.metalnessMap,
    metalness: THREE.MathUtils.clamp(original.metalness * 0.15, 0, 0.08),
    roughness: THREE.MathUtils.clamp(original.roughness * 0.45, 0.04, 0.22),
    aoMap: original.aoMap,
    aoMapIntensity: Math.min(original.aoMapIntensity ?? 1, 0.65),
    alphaMap: original.alphaMap,
    transparent: original.transparent,
    opacity: original.opacity,
    side: original.side,
    vertexColors: original.vertexColors,

    // Bright porcelain base so the whole silhouette reads lit, not patchy
    color: new THREE.Color('#f6f8ff'),

    envMapIntensity: 1.05,

    clearcoat: 1,
    clearcoatRoughness: 0.04,

    // Uniform white inner glow (no emissiveMap → 通体发白光，bloom 才跟得上)
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: null,
    emissiveIntensity: 1.55,

    // Softer iridescence so the mass stays white; edges still pick up moonbow
    iridescence: 0.28,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [120, 420],

    // Mane still catches gold from albedo + grazing sheen
    sheen: 0.52,
    sheenColor: new THREE.Color(1.0, 0.82, 0.48),
    sheenRoughness: 0.32,

    anisotropy: 0.22,
    anisotropyRotation: 0.85,
  })

  if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
  if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace
  if (m.normalMap) m.normalMap.colorSpace = THREE.LinearSRGBColorSpace
  if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace
  if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace

  // Let emissive exceed tone curve → strong bloom halo (通体白光感)
  m.toneMapped = false

  // Do not dispose `original`: it would dispose textures still used by `m` (map, normal, etc.).
  return m
}

function useEnhancedUnicornScene() {
  const gltf = useGLTF(unicornGltfUrl)

  return useMemo(() => {
    const root = gltf.scene.clone(true)

    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const mats = Array.isArray(child.material)
        ? child.material
        : [child.material]
      const next = mats.map((mat) => enhanceGltfMaterial(mat))
      child.material = next.length === 1 ? next[0]! : next
      child.castShadow = false
      child.receiveShadow = false
    })

    return root
  }, [gltf])
}

export function Unicorn() {
  const root = useRef<THREE.Group>(null)
  const { dragRotation, dragActive } = useWeddingMotion()
  const reducedMotion = usePrefersReducedMotion()
  const entrance = useRef({ u: 0 })
  const baseScale = useRef({ s: 1 })

  const model = useEnhancedUnicornScene()

  useFrame((state, delta) => {
    if (!root.current) return

    damp(entrance.current, 'u', 1, reducedMotion ? 0.35 : 2.4, delta)

    const t = state.clock.elapsedTime
    const floatY = reducedMotion
      ? 0
      : Math.sin(t * 0.55) * 0.07 + Math.sin(t * 0.31) * 0.03
    const floatZ = reducedMotion ? 0 : Math.cos(t * 0.42) * 0.04
    const roll = reducedMotion ? 0 : Math.sin(t * 0.28) * 0.018

    const baseYaw = -0.42
    const drag = dragRotation.current
    const targetY = baseYaw + drag.yaw
    const targetX = drag.pitch + roll

    dampE(
      root.current.rotation,
      [targetX, targetY, roll * 0.6],
      dragActive.current ? 0.28 : reducedMotion ? 0.2 : 0.55,
      delta,
    )

    damp(baseScale.current, 's', 1, reducedMotion ? 0.25 : 0.65, delta)

    const intro = THREE.MathUtils.smoothstep(entrance.current.u, 0, 1)
    const introScale = THREE.MathUtils.lerp(0.84, 1, intro)
    const s = introScale * baseScale.current.s

    root.current.position.y = floatY
    root.current.position.z = floatZ
    root.current.scale.setScalar(s)
  })

  return (
    <group ref={root} position={[0.72, -0.78, 0]} rotation={[0, 0, 0]}>
      <Center disableY={false} precise>
        <primitive object={model} scale={3.95} />
      </Center>
    </group>
  )
}
