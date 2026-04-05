import type { RefObject } from 'react'
import catImg from '../assets/cat.png'

type Props = {
  sectionRef: RefObject<HTMLElement | null>
}

export function ThankYouSection({ sectionRef }: Props) {
  return (
    <section
      ref={sectionRef}
      className="journey-panel journey-panel--thank-you"
      aria-label="Thank you"
    >
      <div className="thank-you" role="region" aria-label="Thank you">
        <div className="thank-you__veil" aria-hidden="true" />
        <div className="thank-you__inner">
          <img
            src={catImg}
            alt=""
            className="thank-you__cat"
            width={640}
            height={640}
            decoding="async"
          />
          <div className="thank-you__copy">
            <p className="thank-you__eyebrow">with all our love</p>
            <h1 className="thank-you__title">Thank you</h1>
            <p className="thank-you__line">for sharing this day with us</p>
          </div>
        </div>
      </div>
    </section>
  )
}
