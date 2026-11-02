import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Runs `onFrame` on every animation frame through a single `requestAnimationFrame` loop.
 * `onFrame` must write to the DOM through refs: updating React state every frame would re-render the board.
 */
export function usePlaybackLoop(onFrame) {
  const onFrameRef = useRef(onFrame)

  useLayoutEffect(() => {
    onFrameRef.current = onFrame
  })

  useEffect(() => {
    let frameId
    const tick = () => {
      onFrameRef.current()
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])
}
