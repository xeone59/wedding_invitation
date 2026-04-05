import { useRef, useState } from 'react'
import { JourneySnapProvider } from './context/JourneySnapContext'
import {
  KraftSection,
  MoonSection,
  ThankYouSection,
  UnlockSection,
} from './journey'

function App() {
  const unlockSectionRef = useRef<HTMLElement>(null)
  const moonSectionRef = useRef<HTMLElement>(null)
  const kraftSectionRef = useRef<HTMLElement>(null)
  const thankYouSectionRef = useRef<HTMLElement>(null)

  const [heartUnlocked, setHeartUnlocked] = useState(false)

  return (
    <JourneySnapProvider
      heartUnlocked={heartUnlocked}
      unlockSectionRef={unlockSectionRef}
      moonSectionRef={moonSectionRef}
      kraftSectionRef={kraftSectionRef}
      thankYouSectionRef={thankYouSectionRef}
    >
      <div className="journey">
        <UnlockSection
          sectionRef={unlockSectionRef}
          heartUnlocked={heartUnlocked}
          setHeartUnlocked={setHeartUnlocked}
        />
        <MoonSection sectionRef={moonSectionRef} />
        <KraftSection sectionRef={kraftSectionRef} />
        <ThankYouSection sectionRef={thankYouSectionRef} />
      </div>
    </JourneySnapProvider>
  )
}

export default App
