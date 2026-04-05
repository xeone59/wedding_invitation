import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react'
import { initSaturnHeart } from '../scenes/saturnHeart'

type Props = {
  sectionRef: RefObject<HTMLElement | null>
  heartUnlocked: boolean
  setHeartUnlocked: Dispatch<SetStateAction<boolean>>
}

export function UnlockSection({
  sectionRef,
  heartUnlocked,
  setHeartUnlocked,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let api: Awaited<ReturnType<typeof initSaturnHeart>> | undefined
    void initSaturnHeart(el, {
      onHeartModeChange: (active) => {
        setHeartUnlocked(active)
        /* 仅在仍停留在首屏附近时滚回顶部，避免在后续屏误触退出爱心后跳到土星 */
        if (!active && window.scrollY < window.innerHeight * 0.9) {
          window.scrollTo(0, 0)
        }
      },
    }).then((a) => {
      api = a
    })
    return () => {
      api?.dispose()
    }
  }, [setHeartUnlocked])

  useEffect(() => {
    if (heartUnlocked) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) e.preventDefault()
    }
    document.addEventListener('wheel', onWheel, { passive: false })
    return () => document.removeEventListener('wheel', onWheel)
  }, [heartUnlocked])

  return (
    <section
      ref={sectionRef}
      className={`journey-panel journey-panel--unlock${heartUnlocked ? ' journey-panel--unlock--heart' : ''}`}
      aria-label="Opening"
    >
      <div ref={mountRef} className="journey-panel__mount" />
      {heartUnlocked ? (
        <p className="journey-scroll-hint">Scroll to continue</p>
      ) : null}
    </section>
  )
}
