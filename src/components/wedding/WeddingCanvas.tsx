import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
} from '@react-three/postprocessing'
import { Unicorn } from './Unicorn'
import { EtherField } from './EtherField'

function MoonlitStage() {
  return (
    <>
      <ambientLight intensity={0.14} color="#9aa8c0" />
      <directionalLight
        position={[6, 10, 7]}
        intensity={1.05}
        color="#dce6f5"
        castShadow={false}
      />
      <directionalLight
        position={[-8, 5, -6]}
        intensity={0.32}
        color="#6a7a9a"
      />
      <pointLight position={[2, 3, 4]} intensity={0.45} color="#e8eef8" distance={18} decay={2} />
      {/* Hero fill: cool white so the mesh reads luminous, not underexposed */}
      <pointLight position={[1.2, 0.4, 3.2]} intensity={1.15} color="#f4f7ff" distance={14} decay={2} />
      <pointLight position={[-2.5, 1.2, 2.8]} intensity={0.42} color="#dfe8ff" distance={16} decay={2} />
      <spotLight
        position={[0, 12, 2]}
        angle={0.35}
        penumbra={1}
        intensity={0.55}
        color="#b8c8e0"
        distance={28}
      />
      <Suspense fallback={null}>
        <Environment
          preset="night"
          environmentIntensity={0.26}
          blur={0.75}
          background={false}
        />
      </Suspense>
      <EtherField />
      <Unicorn />
    </>
  )
}

function PostFX() {
  return (
    <EffectComposer
      multisampling={0}
      frameBufferType={THREE.UnsignedByteType}
      resolutionScale={1}
    >
      <Bloom
        luminanceThreshold={0.045}
        luminanceSmoothing={0.55}
        intensity={2.35}
        mipmapBlur
        radius={0.98}
      />
      <BrightnessContrast brightness={0.04} contrast={0.08} />
    </EffectComposer>
  )
}

export function WeddingCanvas() {
  return (
    <Canvas
      className="wedding-canvas"
      camera={{ position: [0, 0.08, 6.72], fov: 36, near: 0.1, far: 80 }}
      dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2]}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={({ gl, scene }) => {
        scene.background = null
        gl.setClearColor(0x000000, 0)
      }}
    >
      <MoonlitStage />
      <PostFX />
    </Canvas>
  )
}
