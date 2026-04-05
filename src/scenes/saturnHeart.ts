import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const HEART_TEX_RIGHT = 'public/unlock/zyronmatrix_export_1775333639890.svgg'
const HEART_TEX_LEFT = 'public/unlock/zyronmatrix_export_1775334780531.svg'

export type SaturnHeartApi = {
  dispose: () => void
  isHeartMode: () => boolean
}

export async function initSaturnHeart(
  container: HTMLElement,
  callbacks?: { onHeartModeChange?: (active: boolean) => void },
): Promise<SaturnHeartApi> {
  const TEXT_FONT = '700 280px "Cormorant Garamond", "Times New Roman", serif'
  await document.fonts.load('700 280px "Cormorant Garamond"')

  const HEART_Y_CENTER = -1.15
  const texLoader = new THREE.TextureLoader()
  const heartMatrixTex = await texLoader.loadAsync(HEART_TEX_RIGHT)
  heartMatrixTex.colorSpace = THREE.SRGBColorSpace

  const heartMatrixTexLeft = await texLoader.loadAsync(HEART_TEX_LEFT)
  heartMatrixTexLeft.colorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, 0.02)

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    1000,
  )
  const defaultCamPos = new THREE.Vector3()

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableRotate = true

  let isHeartShape = false
  let currentSaturnRotY = 0

  const saturnTargetRotX = Math.PI / 5.5
  const saturnTargetRotZ = Math.PI / 7

  const planetParticlesCount = 9000
  const ringParticlesCount = 14000
  const totalParticles = planetParticlesCount + ringParticlesCount

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(totalParticles * 3)
  const basePositions = new Float32Array(totalParticles * 3)
  const heartPositions = new Float32Array(totalParticles * 3)

  const colors = new Float32Array(totalParticles * 3)
  const baseColors = new Float32Array(totalParticles * 3)

  const targetHeartColor = new THREE.Color(0xed1b6c)

  let i3 = 0
  const planetRadius = 3.5
  const ringOuterRadius = 9

  function updateCameraPosition() {
    const w = container.clientWidth
    const h = Math.max(container.clientHeight, 1)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const requiredWidth = (ringOuterRadius * 2) / 0.75
    const fovRad = THREE.MathUtils.degToRad(camera.fov / 2)
    const distance = requiredWidth / (2 * Math.tan(fovRad) * camera.aspect)
    camera.position.set(0, -distance * 0.35, distance)

    defaultCamPos.copy(camera.position)

    camera.lookAt(0, 0, 0)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  const tempColor = new THREE.Color()
  for (let i = 0; i < planetParticlesCount; i++) {
    const r = planetRadius * Math.cbrt(Math.random())
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)

    setParticleData(i3, x, y, z)

    const normalizedY = y / planetRadius
    const band = Math.sin(normalizedY * 12)

    if (band > 0.6) tempColor.setHex(0xead6b8)
    else if (band > 0.2) tempColor.setHex(0xc2a882)
    else if (band > -0.4) tempColor.setHex(0x9e8462)
    else tempColor.setHex(0xd8c4a6)

    tempColor.lerp(new THREE.Color(0xffffff), Math.random() * 0.1)
    setParticleColor(i3, tempColor)
    i3 += 3
  }

  const ringInnerRadius = 4.8
  for (let i = 0; i < ringParticlesCount; i++) {
    const r = ringInnerRadius + Math.random() * (ringOuterRadius - ringInnerRadius)
    const theta = Math.random() * 2 * Math.PI
    const y = (Math.random() - 0.5) * 0.2

    const x = r * Math.cos(theta)
    const z = r * Math.sin(theta)

    setParticleData(i3, x, y, z)

    const normalizedR = (r - ringInnerRadius) / (ringOuterRadius - ringInnerRadius)

    if (normalizedR < 0.2) tempColor.setHex(0x8a7f71)
    else if (normalizedR < 0.6) tempColor.setHex(0xccc0b0)
    else if (normalizedR < 0.65) tempColor.setHex(0x111111)
    else tempColor.setHex(0x968a7c)

    setParticleColor(i3, tempColor)
    i3 += 3
  }

  function setParticleData(index: number, x: number, y: number, z: number) {
    positions[index] = x
    positions[index + 1] = y
    positions[index + 2] = z
    basePositions[index] = x
    basePositions[index + 1] = y
    basePositions[index + 2] = z
  }

  function setParticleColor(index: number, color: THREE.Color) {
    colors[index] = color.r
    colors[index + 1] = color.g
    colors[index + 2] = color.b
    baseColors[index] = color.r
    baseColors[index + 1] = color.g
    baseColors[index + 2] = color.b
  }

  let filled = 0
  const heartScale = 2.4
  while (filled < totalParticles) {
    const mx = (Math.random() - 0.5) * 3.0
    const my = (Math.random() - 0.5) * 3.0
    const mz = (Math.random() - 0.5) * 3.0

    const a = mx * mx + 2.25 * mz * mz + my * my - 1
    const val = a * a * a - mx * mx * my * my * my - 0.1125 * mz * mz * my * my * my

    if (val <= 0) {
      heartPositions[filled * 3] = mx * heartScale
      heartPositions[filled * 3 + 1] = my * heartScale
      heartPositions[filled * 3 + 2] = mz * heartScale
      filled++
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const particleSystem = new THREE.Points(geometry, material)

  particleSystem.rotation.set(saturnTargetRotX, 0, saturnTargetRotZ)
  scene.add(particleSystem)

  function createTextSprite(text: string) {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2d context unavailable')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#ffffff'
    ctx.font = TEXT_FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 512, 256)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0x777777,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(1.6, 0.8, 1)
    sprite.userData = { isPink: false }
    return sprite
  }

  const sprite1 = createTextSprite('Seth')
  sprite1.position.set(-6.2, 0.5, 3.5)

  const sprite2 = createTextSprite('Seona')
  sprite2.position.set(6.2, -0.5, -3.5)

  particleSystem.add(sprite1)
  particleSystem.add(sprite2)

  const heartMatrixSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: heartMatrixTex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  )
  heartMatrixSprite.scale.set(3.4, 3.4, 1)
  heartMatrixSprite.position.set(6.75, HEART_Y_CENTER, 0)
  heartMatrixSprite.visible = false
  scene.add(heartMatrixSprite)

  const heartMatrixSpriteLeft = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: heartMatrixTexLeft,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  )
  heartMatrixSpriteLeft.scale.set(3.4, 3.4 * 1.2, 1)
  heartMatrixSpriteLeft.position.set(-6.75, HEART_Y_CENTER, 0)
  heartMatrixSpriteLeft.visible = false
  scene.add(heartMatrixSpriteLeft)

  updateCameraPosition()

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let startX = 0
  let startY = 0

  function setHeartMode(next: boolean) {
    if (isHeartShape === next) return
    isHeartShape = next
    callbacks?.onHeartModeChange?.(next)
  }

  const onPointerDown = (e: PointerEvent) => {
    startX = e.clientX
    startY = e.clientY
  }

  const onPointerUp = (e: PointerEvent) => {
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY)
    if (dist < 5) {
      if (isHeartShape) {
        setHeartMode(false)
        sprite1.userData.isPink = false
        sprite2.userData.isPink = false
        sprite1.material.color.set(0x777777)
        sprite2.material.color.set(0x777777)

        sprite1.visible = true
        sprite2.visible = true
        heartMatrixSprite.visible = false
        heartMatrixSpriteLeft.visible = false
        controls.enableRotate = true

        currentSaturnRotY = particleSystem.rotation.y
        return
      }

      const rect = container.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects([sprite1, sprite2])

      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Sprite
        obj.userData.isPink = !obj.userData.isPink
        obj.material.color.set(obj.userData.isPink ? 0xed1b6c : 0x777777)

        if (sprite1.userData.isPink && sprite2.userData.isPink) {
          setHeartMode(true)

          sprite1.visible = false
          sprite2.visible = false
          heartMatrixSprite.visible = true
          heartMatrixSpriteLeft.visible = true
          controls.enableRotate = false
        }
      }
    }
  }

  const onResize = () => {
    renderer.setSize(container.clientWidth, Math.max(container.clientHeight, 1))
    updateCameraPosition()
  }

  /* 只监听 unlock 容器，避免爱心模式下在后续页面点击被当成「退出爱心」并触发整页 scrollTo(0) */
  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('pointerup', onPointerUp)
  window.addEventListener('resize', onResize)

  const clock = new THREE.Clock()
  let raf = 0
  let disposed = false

  function animate() {
    if (disposed) return
    raf = requestAnimationFrame(animate)
    const elapsedTime = clock.getElapsedTime()

    const posAttr = geometry.attributes.position
    const colorAttr = geometry.attributes.color

    if (isHeartShape) {
      particleSystem.rotation.x += (0 - particleSystem.rotation.x) * 0.05
      particleSystem.rotation.y += (0 - particleSystem.rotation.y) * 0.05
      particleSystem.rotation.z += (0 - particleSystem.rotation.z) * 0.05

      camera.position.lerp(defaultCamPos, 0.05)
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
    } else {
      currentSaturnRotY -= 0.0005

      particleSystem.rotation.x += (saturnTargetRotX - particleSystem.rotation.x) * 0.05
      particleSystem.rotation.y += (currentSaturnRotY - particleSystem.rotation.y) * 0.05
      particleSystem.rotation.z += (saturnTargetRotZ - particleSystem.rotation.z) * 0.05
    }

    for (let i = 0; i < totalParticles; i++) {
      const index = i * 3
      let targetX: number
      let targetY: number
      let targetZ: number
      let targetR: number
      let targetG: number
      let targetB: number

      if (isHeartShape) {
        const beat = 1 + 0.35 * Math.pow(Math.sin(elapsedTime * 5.5), 2)
        targetX = heartPositions[index] * beat
        targetY = heartPositions[index + 1] * beat + HEART_Y_CENTER
        targetZ = heartPositions[index + 2] * beat

        targetR = targetHeartColor.r
        targetG = targetHeartColor.g
        targetB = targetHeartColor.b
      } else {
        const bx = basePositions[index]
        const by = basePositions[index + 1]
        const bz = basePositions[index + 2]

        targetX = bx + Math.sin(elapsedTime * 2 + bx) * 0.05
        targetY = by + Math.cos(elapsedTime * 2 + by) * 0.05
        targetZ = bz + Math.sin(elapsedTime * 2 + bz) * 0.05

        targetR = baseColors[index]
        targetG = baseColors[index + 1]
        targetB = baseColors[index + 2]
      }

      posAttr.array[index] += (targetX - posAttr.array[index]) * 0.06
      posAttr.array[index + 1] += (targetY - posAttr.array[index + 1]) * 0.06
      posAttr.array[index + 2] += (targetZ - posAttr.array[index + 2]) * 0.06

      colorAttr.array[index] += (targetR - colorAttr.array[index]) * 0.05
      colorAttr.array[index + 1] += (targetG - colorAttr.array[index + 1]) * 0.05
      colorAttr.array[index + 2] += (targetB - colorAttr.array[index + 2]) * 0.05
    }

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true

    controls.update()
    renderer.render(scene, camera)
  }

  animate()

  return {
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      geometry.dispose()
      material.dispose()
      heartMatrixTex.dispose()
      heartMatrixTexLeft.dispose()
      sprite1.material.map?.dispose()
      sprite2.material.map?.dispose()
      ;(sprite1.material as THREE.SpriteMaterial).dispose()
      ;(sprite2.material as THREE.SpriteMaterial).dispose()
      ;(heartMatrixSprite.material as THREE.SpriteMaterial).dispose()
      ;(heartMatrixSpriteLeft.material as THREE.SpriteMaterial).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    },
    isHeartMode: () => isHeartShape,
  }
}
