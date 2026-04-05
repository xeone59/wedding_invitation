import { useEffect, useRef, useState, type RefObject } from 'react'
import { JourneyGoldCue } from '../components/JourneyGoldCue'
import { initKraftBowInvitation } from '../scenes/kraftBowInvitation'

type Props = {
  sectionRef: RefObject<HTMLElement | null>
}

export function KraftSection({ sectionRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [startKraftScene, setStartKraftScene] = useState(false)
  const kraftStartedRef = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ob = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting)
        if (hit && !kraftStartedRef.current) {
          kraftStartedRef.current = true
          setStartKraftScene(true)
        }
      },
      { root: null, threshold: 0.06, rootMargin: '0px 0px -5% 0px' },
    )
    ob.observe(section)
    return () => ob.disconnect()
  }, [sectionRef])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !startKraftScene) return
    const api = initKraftBowInvitation(mount)
    return () => api.dispose()
  }, [startKraftScene])

  return (
    <section
      ref={sectionRef}
      className="journey-panel journey-panel--kraft"
      aria-label="Paper invitation"
    >
      <div ref={mountRef} className="journey-panel__mount journey-panel__mount--kraft" />
      <JourneyGoldCue />
    </section>
  )
}
