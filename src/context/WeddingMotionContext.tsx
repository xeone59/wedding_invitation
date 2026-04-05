import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

/** Extra yaw/pitch from click-drag on the canvas (radians). */
export type DragRotation = { yaw: number; pitch: number }

export type WeddingMotionValue = {
  dragRotation: React.MutableRefObject<DragRotation>
  dragActive: React.MutableRefObject<boolean>
}

const WeddingMotionContext = createContext<WeddingMotionValue | null>(null)

export function WeddingMotionProvider({ children }: { children: ReactNode }) {
  const dragRotation = useRef<DragRotation>({ yaw: 0, pitch: 0 })
  const dragActive = useRef(false)

  const value = useMemo(
    () => ({ dragRotation, dragActive }),
    [dragRotation, dragActive],
  )

  return (
    <WeddingMotionContext.Provider value={value}>
      {children}
    </WeddingMotionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useWeddingMotion() {
  const ctx = useContext(WeddingMotionContext)
  if (!ctx) {
    throw new Error('useWeddingMotion must be used within WeddingMotionProvider')
  }
  return ctx
}
