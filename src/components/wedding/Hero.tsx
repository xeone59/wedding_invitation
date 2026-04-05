import { lazy, Suspense, useEffect, useRef } from 'react'
import { WeddingMotionProvider, useWeddingMotion } from '../../context/WeddingMotionContext'
import { JourneyGoldCue } from '../JourneyGoldCue'
import { TextPanel } from './TextPanel'

const WeddingCanvas = lazy(() =>
  import('./WeddingCanvas').then((m) => ({ default: m.WeddingCanvas })),
)

function CanvasDragSurface() {
  const { dragRotation, dragActive } = useWeddingMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const sensitivity = 0.0038

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging.current = true
      dragActive.current = true
      el.setPointerCapture(e.pointerId)
    }

    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false
      dragActive.current = false
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* capture already released */
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      dragRotation.current.yaw += e.movementX * sensitivity
      dragRotation.current.pitch = Math.max(
        -0.62,
        Math.min(0.62, dragRotation.current.pitch - e.movementY * sensitivity),
      )
    }

    const onLostCapture = () => {
      dragging.current = false
      dragActive.current = false
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('lostpointercapture', onLostCapture)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('lostpointercapture', onLostCapture)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dragActive is a stable ref
  }, [dragRotation])

  return (
    <div
      ref={wrapRef}
      className="hero__canvas-wrap hero__canvas-wrap--fullscreen hero__canvas-wrap--draggable"
      role="application"
      aria-label="Drag to rotate the sculpture"
    >
      <Suspense fallback={<div className="canvas-fallback" aria-hidden />}>
        <WeddingCanvas />
      </Suspense>
    </div>
  )
}

function HeroInner() {
  return (
    <>
      <div className="hero__veil" aria-hidden="true" />
      <div className="hero__moon-glow" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />
      <CanvasDragSurface />
      <div className="hero__haze" aria-hidden="true" />
      <div className="hero__text-layer">
        <TextPanel />
      </div>
    </>
  )
}

/** Full vertical journey: moonlit hero (sticky) + scroll spacer in parent section. */
export function HeroJourneyBlock() {
  return (
    <WeddingMotionProvider>
      <div className="journey-panel__sticky">
        <JourneyGoldCue />
        <section className="hero hero--journey" aria-label="Welcome">
          <HeroInner />
        </section>
      </div>
      <div className="scroll-spacer" aria-hidden="true" />
    </WeddingMotionProvider>
  )
}
