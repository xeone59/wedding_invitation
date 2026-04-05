/* eslint-disable react-refresh/only-export-components -- provider + hook pair */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'

type JourneySnapContextValue = {
  snapNext: () => void
  snapPrev: () => void
}

const JourneySnapContext = createContext<JourneySnapContextValue | null>(null)

/** 触控板单次手势会连发多帧 wheel；吸附后需冷却，避免连跳两屏 */
const SNAP_COOLDOWN_MS = 1150

export function useJourneySnap() {
  return useContext(JourneySnapContext) ?? { snapNext: () => {}, snapPrev: () => {} }
}

type ProviderProps = {
  children: ReactNode
  heartUnlocked: boolean
  unlockSectionRef: RefObject<HTMLElement | null>
  moonSectionRef: RefObject<HTMLElement | null>
  kraftSectionRef: RefObject<HTMLElement | null>
  thankYouSectionRef: RefObject<HTMLElement | null>
}

export function JourneySnapProvider({
  children,
  heartUnlocked,
  unlockSectionRef,
  moonSectionRef,
  kraftSectionRef,
  thankYouSectionRef,
}: ProviderProps) {
  const lockUntil = useRef(0)
  const touchY0 = useRef<number | null>(null)
  const wheelAcc = useRef(0)
  const wheelRaf = useRef<number | null>(null)

  const buildSnapPoints = useCallback((): number[] => {
    const vh = window.innerHeight
    const u = unlockSectionRef.current
    const moon = moonSectionRef.current
    const kraft = kraftSectionRef.current
    const thanks = thankYouSectionRef.current
    if (!u || !moon || !kraft || !thanks) return [0]

    const raw: number[] = []
    raw.push(u.offsetTop)
    raw.push(moon.offsetTop)
    const moonEnd = moon.offsetTop + Math.max(0, moon.offsetHeight - vh)
    if (moonEnd > moon.offsetTop + vh * 0.4) raw.push(moonEnd)
    raw.push(kraft.offsetTop)
    raw.push(thanks.offsetTop)

    const sorted = [...new Set(raw.map((y) => Math.round(y)))].sort((a, b) => a - b)
    return sorted
  }, [unlockSectionRef, moonSectionRef, kraftSectionRef, thankYouSectionRef])

  const snapTo = useCallback(
    (y: number) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const t = Math.min(max, Math.max(0, y))
      window.scrollTo({ top: t, behavior: 'smooth' })
    },
    [],
  )

  const snapNext = useCallback(() => {
    if (!heartUnlocked) return
    const now = Date.now()
    if (now < lockUntil.current) return

    const snaps = buildSnapPoints()
    const y = window.scrollY + window.innerHeight * 0.08
    const next = snaps.find((s) => s > y + 24)
    if (next === undefined) return

    lockUntil.current = now + SNAP_COOLDOWN_MS
    snapTo(next)
  }, [heartUnlocked, buildSnapPoints, snapTo])

  const snapPrev = useCallback(() => {
    if (!heartUnlocked) return
    const now = Date.now()
    if (now < lockUntil.current) return

    const snaps = buildSnapPoints()
    const y = window.scrollY - window.innerHeight * 0.08
    const prev = [...snaps].reverse().find((s) => s < y - 24)
    if (prev === undefined) return

    lockUntil.current = now + SNAP_COOLDOWN_MS
    snapTo(prev)
  }, [heartUnlocked, buildSnapPoints, snapTo])

  useEffect(() => {
    if (!heartUnlocked) return

    const WHEEL_THRESHOLD = 32

    const flushWheel = () => {
      wheelRaf.current = null
      const acc = wheelAcc.current
      wheelAcc.current = 0
      if (Math.abs(acc) < WHEEL_THRESHOLD) return

      const now = Date.now()
      if (now < lockUntil.current) return

      if (acc > 0) snapNext()
      else snapPrev()
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2) return
      e.preventDefault()
      wheelAcc.current += e.deltaY
      if (wheelRaf.current == null) {
        wheelRaf.current = requestAnimationFrame(flushWheel)
      }
    }

    document.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      document.removeEventListener('wheel', onWheel)
      if (wheelRaf.current != null) cancelAnimationFrame(wheelRaf.current)
      wheelRaf.current = null
      wheelAcc.current = 0
    }
  }, [heartUnlocked, snapNext, snapPrev])

  useEffect(() => {
    if (!heartUnlocked) return

    const onTouchStart = (e: TouchEvent) => {
      touchY0.current = e.touches[0]?.clientY ?? null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const y0 = touchY0.current
      touchY0.current = null
      if (y0 == null) return
      const y1 = e.changedTouches[0]?.clientY
      if (y1 == null) return
      const dy = y0 - y1
      if (dy > 48) snapNext()
      else if (dy < -48) snapPrev()
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [heartUnlocked, snapNext, snapPrev])

  const value = useMemo(
    () => ({ snapNext, snapPrev }),
    [snapNext, snapPrev],
  )

  return (
    <JourneySnapContext.Provider value={value}>{children}</JourneySnapContext.Provider>
  )
}
