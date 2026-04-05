import type { RefObject } from 'react'
import { HeroJourneyBlock } from '../components/wedding/Hero'

type Props = {
  sectionRef: RefObject<HTMLElement | null>
}

export function MoonSection({ sectionRef }: Props) {
  return (
    <section
      ref={sectionRef}
      className="journey-panel journey-panel--moon"
      data-journey="moon"
      aria-label="Moonlit invitation"
    >
      <HeroJourneyBlock />
    </section>
  )
}
