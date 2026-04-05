import gsap from 'gsap'
import * as THREE from 'three'
import { RGBADepthPacking } from 'three'
import clickSvgUrl from '../assets/click.svg?url'

const COVER_URL = `${import.meta.env.BASE_URL}kraft/cover.svg`

export type KraftBowApi = { dispose: () => void }

function ndcFromRoot(root: HTMLElement, clientX: number, clientY: number) {
  const r = root.getBoundingClientRect()
  const w = Math.max(r.width, 1)
  const h = Math.max(r.height, 1)
  return {
    x: ((clientX - r.left) / w) * 2 - 1,
    y: -((clientY - r.top) / h) * 2 + 1,
  }
}

export function initKraftBowInvitation(root: HTMLElement): KraftBowApi {
  root.classList.add('kraft-invite-root')

  const fontPreload = document.createElement('div')
  fontPreload.className = 'kraft-invite__font-preload'
  fontPreload.textContent = 'Pinyon'
  fontPreload.setAttribute('aria-hidden', 'true')

  const loader = document.createElement('div')
  loader.className = 'kraft-invite__loader'
  loader.innerHTML =
    '<div class="kraft-invite__spinner" aria-hidden="true"></div><div class="kraft-invite__loader-text">Preparing Experience</div>'

  const hint = document.createElement('div')
  hint.className = 'kraft-invite__hint'
  hint.textContent = 'CLICK THE BOW TO UNTIE'

  const webglHost = document.createElement('div')
  webglHost.className = 'kraft-invite__webgl'

  const clickCue = document.createElement('div')
  clickCue.className = 'kraft-click-cue'
  clickCue.setAttribute('aria-hidden', 'true')
  const clickInner = document.createElement('div')
  clickInner.className = 'kraft-click-cue__inner'
  const clickImg = document.createElement('img')
  clickImg.src = clickSvgUrl
  clickImg.alt = ''
  clickImg.decoding = 'async'
  clickInner.appendChild(clickImg)
  clickCue.appendChild(clickInner)

  root.append(fontPreload, loader, hint, webglHost)
  const kraftSection = root.parentElement
  if (kraftSection) kraftSection.appendChild(clickCue)
  else document.body.appendChild(clickCue)

  const rw = () => Math.max(root.clientWidth, 1)
  const rh = () => Math.max(root.clientHeight, 1)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x020202)
  scene.fog = new THREE.FogExp2(0x020202, 0.015)

  const camera = new THREE.PerspectiveCamera(35, rw() / rh(), 0.1, 100)
  camera.position.set(0, 0, 16)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(rw(), rh())
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  webglHost.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xfff5e6, 0.4))
  const keyLight = new THREE.SpotLight(0xffeedd, 200)
  keyLight.position.set(5, 10, 12)
  keyLight.angle = Math.PI / 4
  keyLight.penumbra = 0.5
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.bias = -0.0005
  scene.add(keyLight)

  const fillLight = new THREE.PointLight(0x90b0d0, 60)
  fillLight.position.set(-8, -4, 8)
  scene.add(fillLight)
  const rimLight = new THREE.PointLight(0xffd5a0, 150)
  rimLight.position.set(0, 6, -6)
  scene.add(rimLight)

  const cardGroup = new THREE.Group()
  scene.add(cardGroup)

  const cardWidth = 4.0
  const cardHeight = cardWidth * 1.414
  const cardThickness = 0.04

  const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.9 })
  const textureLoader = new THREE.TextureLoader()
  const frontMaterial = paperMaterial.clone()

  textureLoader.load(COVER_URL, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    frontMaterial.map = texture
    frontMaterial.needsUpdate = true
  })

  const coverCard = new THREE.Mesh(
    new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness),
    [paperMaterial, paperMaterial, paperMaterial, paperMaterial, frontMaterial, paperMaterial],
  )
  coverCard.castShadow = true
  coverCard.receiveShadow = true
  cardGroup.add(coverCard)

  let innerCard: THREE.Mesh | undefined
  const innerWidth = cardWidth + 0.3
  const innerHeight = innerWidth * 1.414
  const segX = 15
  const segY = 20

  function createKraftPaper() {
    const w = 1600
    const h = Math.round(1600 * 1.414)
    const canvas = document.createElement('canvas')
    const bumpCanvas = document.createElement('canvas')
    const alphaCanvas = document.createElement('canvas')
    canvas.width = bumpCanvas.width = alphaCanvas.width = w
    canvas.height = bumpCanvas.height = alphaCanvas.height = h

    const ctx = canvas.getContext('2d')
    const bctx = bumpCanvas.getContext('2d')
    const actx = alphaCanvas.getContext('2d')
    if (!ctx || !bctx || !actx) return

    ctx.fillStyle = '#E8DDD0'
    ctx.fillRect(0, 0, w, h)

    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16
      data[i] = Math.min(255, Math.max(0, data[i] + noise))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
    }
    ctx.putImageData(imgData, 0, 0)

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 600, w / 2, h / 2, 1300)
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, 'rgba(110, 95, 80, 0.15)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#2A251F'
    const cx = w / 2
    ctx.font = 'italic 50px "Playfair Display", serif'
    ctx.fillText('With joy in their hearts', cx, 400)
    ctx.font = 'normal 150px "Pinyon Script", cursive'
    ctx.fillText('Xu Luo', cx, 700)
    ctx.font = 'italic 60px "Playfair Display", serif'
    ctx.fillText('&', cx, 880)
    ctx.font = 'normal 150px "Pinyon Script", cursive'
    ctx.fillText('Huailue Xiong', cx, 1080)
    ctx.font = 'normal 45px "Playfair Display", serif'
    ctx.fillText('request the honor of your presence', cx, 1420)
    ctx.fillText('at their wedding celebration', cx, 1490)
    ctx.font = 'bold 50px "Playfair Display", serif'
    ctx.fillText('Friday, the tenth of April', cx, 1750)
    ctx.font = 'normal 45px "Playfair Display", serif'
    ctx.fillText('at five o’clock in the evening', cx, 1850)
    ctx.fillText('Phoenix, AZ', cx, 1930)

    bctx.fillStyle = '#808080'
    bctx.fillRect(0, 0, w, h)
    const bImgData = bctx.getImageData(0, 0, w, h)
    const bData = bImgData.data
    for (let i = 0; i < bData.length; i += 4) {
      const bumpNoise = 128 + (Math.random() - 0.5) * 45
      bData[i] = bData[i + 1] = bData[i + 2] = bumpNoise
    }
    bctx.putImageData(bImgData, 0, 0)

    for (let i = 0; i < 3000; i++) {
      bctx.strokeStyle = Math.random() > 0.5 ? '#909090' : '#707070'
      bctx.lineWidth = Math.random() * 2
      bctx.beginPath()
      const x = Math.random() * w
      const y = Math.random() * h
      bctx.moveTo(x, y)
      bctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30)
      bctx.stroke()
    }

    actx.fillStyle = '#000'
    actx.fillRect(0, 0, w, h)
    actx.fillStyle = '#fff'
    actx.beginPath()
    const margin = 35
    for (let x = margin; x <= w - margin; x += 20) actx.lineTo(x, margin + Math.random() * 20)
    for (let y = margin; y <= h - margin; y += 20)
      actx.lineTo(w - margin - Math.random() * 25, y)
    for (let x = w - margin; x >= margin; x -= 20) actx.lineTo(x, h - margin - Math.random() * 20)
    for (let y = h - margin; y >= margin; y -= 20) actx.lineTo(margin + Math.random() * 25, y)
    actx.fill()

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy()

    const bumpTex = new THREE.CanvasTexture(bumpCanvas)
    bumpTex.anisotropy = renderer.capabilities.getMaxAnisotropy()

    const alphaTex = new THREE.CanvasTexture(alphaCanvas)

    const innerGeo = new THREE.PlaneGeometry(innerWidth, innerHeight, segX, segY)

    const innerMat = new THREE.MeshStandardMaterial({
      map: tex,
      bumpMap: bumpTex,
      bumpScale: 0.008,
      alphaMap: alphaTex,
      alphaTest: 0.1,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 1.0,
      metalness: 0.0,
      color: 0xffffff,
    })

    const mesh = new THREE.Mesh(innerGeo, innerMat)
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
      alphaMap: alphaTex,
      alphaTest: 0.5,
    })
    mesh.position.set(0, 0, -cardThickness - 0.05)
    mesh.castShadow = true
    mesh.receiveShadow = true
    cardGroup.add(mesh)
    innerCard = mesh
  }

  function createHempTexture() {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const ctx = c.getContext('2d')
    if (!ctx) throw new Error('2d')
    ctx.fillStyle = '#9e7952'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 800; i++) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#705131' : '#bd986e'
      ctx.lineWidth = Math.random() * 3 + 1
      ctx.beginPath()
      const x = Math.random() * 512
      const y = Math.random() * 512
      ctx.moveTo(x, y)
      ctx.lineTo(x + 50, y + 100)
      ctx.stroke()
    }
    const imgData = ctx.getImageData(0, 0, 512, 512)
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 40
      imgData.data[i] += noise
      imgData.data[i + 1] += noise
      imgData.data[i + 2] += noise
    }
    ctx.putImageData(imgData, 0, 0)
    const texture = new THREE.CanvasTexture(c)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 10)
    return texture
  }

  const ropeMaterial = new THREE.MeshStandardMaterial({
    map: createHempTexture(),
    bumpMap: createHempTexture(),
    bumpScale: 0.08,
    roughness: 1.0,
    color: 0xbb9977,
  })

  const ropeGroup = new THREE.Group()
  scene.add(ropeGroup)
  const ropeRadius = 0.025
  const zOffset = cardThickness / 2 + 0.015
  const xEdge = cardWidth / 2 + 0.015

  const ropePoints = [
    new THREE.Vector3(0, 0, zOffset + 0.01),
    new THREE.Vector3(xEdge, 0, zOffset),
    new THREE.Vector3(xEdge, 0, -zOffset - 0.02),
    new THREE.Vector3(-xEdge, 0, -zOffset - 0.02),
    new THREE.Vector3(-xEdge, 0, zOffset),
    new THREE.Vector3(0, 0, zOffset + 0.01),
  ]
  const mainRope = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePoints, false), 64, ropeRadius, 12, false),
    ropeMaterial,
  )
  mainRope.castShadow = true
  ropeGroup.add(mainRope)

  const bowGroup = new THREE.Group()
  bowGroup.position.set(0, 0, zOffset)
  ropeGroup.add(bowGroup)

  function createCurveTube(points: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]) {
    const curve = new THREE.CubicBezierCurve3(...points)
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, ropeRadius, 12, false),
      ropeMaterial,
    )
    mesh.castShadow = true
    return mesh
  }

  bowGroup.add(
    createCurveTube([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.8, 0.6, 0.1),
      new THREE.Vector3(-1.0, -0.4, 0.05),
      new THREE.Vector3(0, -0.1, 0.05),
    ]),
  )
  bowGroup.add(
    createCurveTube([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.8, 0.6, 0.1),
      new THREE.Vector3(1.0, -0.4, 0.05),
      new THREE.Vector3(0, -0.1, 0.05),
    ]),
  )
  bowGroup.add(
    createCurveTube([
      new THREE.Vector3(0, -0.1, 0.05),
      new THREE.Vector3(-0.3, -0.6, 0.1),
      new THREE.Vector3(-0.2, -1.2, 0.15),
      new THREE.Vector3(-0.4, -1.8, 0.1),
    ]),
  )
  bowGroup.add(
    createCurveTube([
      new THREE.Vector3(0, -0.1, 0.05),
      new THREE.Vector3(0.3, -0.6, 0.1),
      new THREE.Vector3(0.2, -1.2, 0.15),
      new THREE.Vector3(0.4, -1.8, 0.1),
    ]),
  )
  const centerKnot = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.035, 12, 16), ropeMaterial)
  centerKnot.rotation.set(Math.PI / 2, 0.2, 0)
  centerKnot.position.set(0, -0.05, 0.06)
  centerKnot.castShadow = true
  bowGroup.add(centerKnot)

  const bootLoader = window.setTimeout(() => {
    createKraftPaper()
    loader.style.opacity = '0'
    window.setTimeout(() => loader.remove(), 1000)
    window.setTimeout(() => {
      hint.style.opacity = '1'
    }, 1500)
  }, 1500)

  type Particle = {
    pos: THREE.Vector3
    oldPos: THREE.Vector3
    restWorld: THREE.Vector3
    isPinned: boolean
  }
  let physicsReady = false
  let disposed = false
  const particles: Particle[] = []
  const physicsConstraints: { p1: number; p2: number; dist: number }[] = []
  const restingZLevel = cardThickness / 2 + 0.005

  /** 麻绳揭开后内页就位：click.svg 在请柬右下外侧闪三下再慢慢隐去 */
  function playKraftClickCue() {
    const innerEl = clickCue.querySelector('.kraft-click-cue__inner')
    if (!innerEl) return

    gsap.killTweensOf([clickCue, innerEl])

    const run = () => {
      clickCue.style.visibility = 'visible'
      gsap.set(clickCue, { opacity: 0, visibility: 'visible' })
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(clickCue, { opacity: 0, visibility: 'hidden' })
        },
      })
      const peak = { opacity: 1, duration: 0.12, ease: 'power2.out' }
      const dip = { opacity: 0.18, duration: 0.09, ease: 'power2.in' }
      tl.to(clickCue, peak)
        .to(clickCue, dip)
        .to(clickCue, peak)
        .to(clickCue, dip)
        .to(clickCue, peak)
        .to(clickCue, dip)
        .to(clickCue, { opacity: 0, duration: 2.65, ease: 'power1.out' })
    }

    if (!clickImg.complete) {
      clickImg.addEventListener('load', run, { once: true })
      clickImg.addEventListener('error', run, { once: true })
    } else {
      requestAnimationFrame(run)
    }
  }

  function hidePaperMouseCue() {
    gsap.killTweensOf([clickCue, clickInner])
    clickCue.getAnimations?.().forEach((a) => a.cancel())
    clickCue.style.opacity = '0'
    clickCue.style.visibility = 'hidden'
  }

  function initPhysics() {
    if (!innerCard) return
    innerCard.updateMatrixWorld()
    const posAttr = innerCard.geometry.attributes.position
    const cols = segX + 1
    const rows = segY + 1

    for (let i = 0; i < posAttr.count; i++) {
      const localPos = new THREE.Vector3().fromBufferAttribute(posAttr, i)
      const worldPos = localPos.clone().applyMatrix4(innerCard.matrixWorld)
      particles.push({
        pos: worldPos.clone(),
        oldPos: worldPos.clone(),
        restWorld: worldPos.clone(),
        isPinned: false,
      })
    }

    const addConstraint = (p1: number, p2: number) => {
      const dist = particles[p1].restWorld.distanceTo(particles[p2].restWorld)
      physicsConstraints.push({ p1, p2, dist })
    }

    for (let v = 0; v < rows; v++) {
      for (let u = 0; u < cols; u++) {
        const idx = v * cols + u
        if (u < cols - 1) addConstraint(idx, idx + 1)
        if (v < rows - 1) addConstraint(idx, idx + cols)
        if (v < rows - 1 && u < cols - 1) {
          addConstraint(idx, idx + cols + 1)
          addConstraint(idx + 1, idx + cols)
        }
        if (u < cols - 2) addConstraint(idx, idx + 2)
        if (v < rows - 2) addConstraint(idx, idx + cols * 2)
      }
    }

    scene.add(innerCard)
    innerCard.position.set(0, 0, 0)
    innerCard.rotation.set(0, 0, 0)
    innerCard.scale.set(1, 1, 1)
    innerCard.updateMatrixWorld()
    physicsReady = true

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => playKraftClickCue(), 700)
      })
    })
  }

  function updatePhysics() {
    if (!innerCard) return
    const iterations = 22
    const paperStiffness = 0.12

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      if (p.isPinned) continue

      const velocity = new THREE.Vector3().subVectors(p.pos, p.oldPos)
      p.oldPos.copy(p.pos)
      p.pos.add(velocity).add(new THREE.Vector3(0, 0, -0.005))
      p.pos.lerp(p.restWorld, paperStiffness)
    }

    for (let iter = 0; iter < iterations; iter++) {
      for (const c of physicsConstraints) {
        const p1 = particles[c.p1]
        const p2 = particles[c.p2]
        const delta = new THREE.Vector3().subVectors(p2.pos, p1.pos)
        const dist = delta.length()
        const diff = (dist - c.dist) / dist

        const offset = delta.multiplyScalar(0.5 * diff)
        if (!p1.isPinned) p1.pos.add(offset)
        if (!p2.isPinned) p2.pos.sub(offset)
      }

      for (const p of particles) {
        if (p.pos.z < restingZLevel) {
          p.pos.z = restingZLevel
          p.pos.x = p.pos.x * 0.8 + p.oldPos.x * 0.2
          p.pos.y = p.pos.y * 0.8 + p.oldPos.y * 0.2
        }
      }
    }

    const posAttr = innerCard.geometry.attributes.position
    for (let i = 0; i < particles.length; i++) {
      posAttr.setXYZ(i, particles[i].pos.x, particles[i].pos.y, particles[i].pos.z)
    }
    posAttr.needsUpdate = true
    innerCard.geometry.computeVertexNormals()
  }

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let isOpened = false
  let isHovered = false
  let targetRotX = 0
  let targetRotY = 0

  let draggedNodeIndex = -1
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const dragOffset = new THREE.Vector3()

  const onMouseMove = (event: MouseEvent) => {
    const m = ndcFromRoot(root, event.clientX, event.clientY)
    mouse.x = m.x
    mouse.y = m.y

    if (!isOpened) {
      targetRotY = mouse.x * 0.12
      targetRotX = -mouse.y * 0.12
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(bowGroup.children)
      if (intersects.length > 0) {
        if (!isHovered) {
          isHovered = true
          document.body.style.cursor = 'pointer'
          gsap.to(bowGroup.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3 })
          gsap.to(keyLight, { intensity: 250, duration: 0.3 })
        }
      } else if (isHovered) {
        isHovered = false
        document.body.style.cursor = 'default'
        gsap.to(bowGroup.scale, { x: 1, y: 1, z: 1, duration: 0.3 })
        gsap.to(keyLight, { intensity: 200, duration: 0.3 })
      }
    } else if (physicsReady && draggedNodeIndex !== -1) {
      raycaster.setFromCamera(mouse, camera)
      const targetPos = new THREE.Vector3()
      raycaster.ray.intersectPlane(dragPlane, targetPos)
      particles[draggedNodeIndex].pos.copy(targetPos.sub(dragOffset))
    }
  }

  const onMouseDown = () => {
    if (physicsReady && innerCard) {
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(innerCard)
      if (intersects.length > 0) {
        document.body.style.cursor = 'grabbing'
        hidePaperMouseCue()

        let minDist = Infinity
        let best = 0
        for (let i = 0; i < particles.length; i++) {
          const d = particles[i].pos.distanceTo(intersects[0].point)
          if (d < minDist) {
            minDist = d
            best = i
          }
        }
        draggedNodeIndex = best
        particles[draggedNodeIndex].isPinned = true
        dragPlane.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()).negate(),
          intersects[0].point,
        )
        dragOffset.subVectors(intersects[0].point, particles[draggedNodeIndex].pos)
      }
      return
    }

    if (isOpened || !isHovered) return
    isOpened = true
    hidePaperMouseCue()
    document.body.style.cursor = 'default'
    hint.style.opacity = '0'

    gsap.killTweensOf(cardGroup.rotation)
    gsap.to(cardGroup.rotation, { x: 0, y: 0, duration: 0.5 })
    gsap.to(ropeGroup.rotation, { x: 0, y: 0, duration: 0.5 })

    const tl = gsap.timeline()
    tl.to(bowGroup.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.25, ease: 'power2.in' }, 0)
    tl.to(ropePoints[0], { x: -4, y: -2.5, z: 2.0, duration: 0.8, ease: 'power2.out' }, 0.1)
    tl.to(ropePoints[5], { x: 4, y: -2.0, z: 2.0, duration: 0.8, ease: 'power2.out' }, 0.1)
    tl.to(ropePoints[4], { x: -2, y: -3.0, z: 1.5, duration: 0.8, ease: 'power2.out' }, 0.1)
    tl.to(ropePoints[1], { x: 2, y: -3.0, z: 1.5, duration: 0.8, ease: 'power2.out' }, 0.1)
    tl.to(ropePoints[3], { x: -0.5, y: -3.5, z: 1.0, duration: 0.8, ease: 'power2.out' }, 0.1)
    tl.to(ropePoints[2], { x: 0.5, y: -3.5, z: 1.0, duration: 0.8, ease: 'power2.out' }, 0.1)
    tl.to(
      {},
      {
        duration: 0.8,
        onUpdate: () => {
          mainRope.geometry.dispose()
          mainRope.geometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(ropePoints, false),
            64,
            ropeRadius,
            12,
            false,
          )
        },
      },
      0.1,
    )

    tl.to(ropeGroup.position, { y: -16, duration: 1.2, ease: 'power3.in' }, 0.6)
    tl.to(ropeGroup.rotation, { x: Math.PI * 0.6, z: Math.PI * 0.2, duration: 1.2, ease: 'power2.in' }, 0.6)

    if (innerCard) {
      tl.to(innerCard.position, { y: cardHeight + 0.6, duration: 1.8, ease: 'power2.inOut' }, 1.0)
      tl.to(innerCard.position, { z: cardThickness + 0.05, duration: 0.5, ease: 'power1.inOut' }, 2.6)
      tl.to(
        innerCard.position,
        {
          y: 0,
          duration: 1.6,
          ease: 'power3.inOut',
          onComplete: initPhysics,
        },
        2.9,
      )
    }

    tl.to(camera.position, { z: 12, y: 1.2, duration: 3.5, ease: 'power2.inOut' }, 2.5)
    tl.to(fillLight, { intensity: 80, duration: 2.0 }, 2.8)
  }

  const onMouseUp = () => {
    if (physicsReady && draggedNodeIndex !== -1) {
      document.body.style.cursor = 'default'
      particles[draggedNodeIndex].isPinned = false
      draggedNodeIndex = -1
    }
  }

  const onResize = () => {
    camera.aspect = rw() / rh()
    camera.updateProjectionMatrix()
    renderer.setSize(rw(), rh())
  }

  root.addEventListener('mousemove', onMouseMove)
  root.addEventListener('mousedown', onMouseDown)
  root.addEventListener('mouseup', onMouseUp)
  window.addEventListener('resize', onResize)
  const ro = new ResizeObserver(() => onResize())
  ro.observe(root)

  const clock = new THREE.Clock()
  let raf = 0

  function animate() {
    if (disposed) return
    raf = requestAnimationFrame(animate)
    const delta = clock.getDelta()
    const time = clock.getElapsedTime()

    if (!isOpened) {
      const offsetY = 1.2
      const floatY = Math.sin(time * 1.5) * 0.04
      cardGroup.position.y = floatY + offsetY
      ropeGroup.position.y = floatY + offsetY
      cardGroup.rotation.x += (targetRotX - cardGroup.rotation.x) * 5 * delta
      cardGroup.rotation.y += (targetRotY - cardGroup.rotation.y) * 5 * delta
      ropeGroup.rotation.x = cardGroup.rotation.x
      ropeGroup.rotation.y = cardGroup.rotation.y
    } else if (physicsReady) {
      updatePhysics()
    }

    renderer.render(scene, camera)
  }

  animate()

  return {
    dispose: () => {
      disposed = true
      window.clearTimeout(bootLoader)
      cancelAnimationFrame(raf)
      root.removeEventListener('mousemove', onMouseMove)
      root.removeEventListener('mousedown', onMouseDown)
      root.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      gsap.killTweensOf(bowGroup.scale)
      gsap.killTweensOf(keyLight)
      gsap.killTweensOf(cardGroup.rotation)
      gsap.killTweensOf(ropeGroup.rotation)
      gsap.killTweensOf(ropeGroup.position)
      gsap.killTweensOf(fillLight)
      gsap.killTweensOf(camera.position)
      if (innerCard) gsap.killTweensOf(innerCard.position)
      mainRope.geometry.dispose()
      renderer.dispose()
      clickCue.remove()
      root.replaceChildren()
    },
  }
}
