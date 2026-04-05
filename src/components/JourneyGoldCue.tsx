import { useJourneySnap } from '../context/JourneySnapContext'

type Props = {
  className?: string
}

/** 仅向下箭头，点击触发分页吸附到下一屏 */
export function JourneyGoldCue({ className = '' }: Props) {
  const { snapNext } = useJourneySnap()

  return (
    <button
      type="button"
      className={`journey-gold-cue ${className}`.trim()}
      aria-label="Next section"
      onClick={() => snapNext()}
    >
      <span className="journey-gold-cue__chevron" aria-hidden="true" />
    </button>
  )
}
