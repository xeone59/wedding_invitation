import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const COUNT = 380

export function EtherField() {
  const ref = useRef<THREE.Points>(null)
  const drift = useRef(new THREE.Vector3(0, 0, 0))
  const reducedMotion = usePrefersReducedMotion()

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      /* Random layout is fixed for this mount (empty deps). */
      // eslint-disable-next-line react-hooks/purity -- one-time buffer init
      const r = 4 + Math.random() * 14
      // eslint-disable-next-line react-hooks/purity -- one-time buffer init
      const theta = Math.random() * Math.PI * 2
      // eslint-disable-next-line react-hooks/purity -- one-time buffer init
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55 + 0.2
      pos[i * 3 + 2] = r * Math.cos(phi) * 0.85 - 2
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    if (reducedMotion) {
      drift.current.set(0, 0, 0)
      ref.current.position.set(0, 0, 0)
      ref.current.rotation.y = 0
      return
    }
    damp3(
      drift.current,
      [Math.sin(t * 0.08) * 0.06, Math.cos(t * 0.11) * 0.04, 0],
      0.8,
      delta,
    )
    ref.current.position.copy(drift.current)
    ref.current.rotation.y = t * 0.018
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.026}
        color="#d4dce8"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
