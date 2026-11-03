/**
 * Shared playback clock for a play. Every element reads its position from the same `timeAt(now)`,
 * so playback stays synchronized while pausing, seeking or changing speed.
 *
 * `now` is a wall-clock timestamp in milliseconds (the one `requestAnimationFrame` provides);
 * it is passed in so the clock stays deterministic and testable.
 */
export function createPlaybackClock({ duration: initialDuration }) {
  let duration = initialDuration
  let anchorTime = 0
  let anchorNow = 0
  let rate = 1
  let playing = false

  const clamp = (t) => Math.min(Math.max(t, 0), duration)

  function timeAt(now) {
    if (!playing) return anchorTime
    return clamp(anchorTime + (now - anchorNow) * rate)
  }

  function reanchor(now) {
    anchorTime = timeAt(now)
    anchorNow = now
  }

  return {
    timeAt,
    isPlaying: () => playing,
    hasEnded: (now) => timeAt(now) >= duration,

    play(now) {
      if (playing) return
      if (anchorTime >= duration) anchorTime = 0
      anchorNow = now
      playing = true
    },

    pause(now) {
      reanchor(now)
      playing = false
    },

    seek(t, now) {
      anchorTime = clamp(t)
      anchorNow = now
    },

    /** Recording uses `Infinity` so time keeps running past the current end of the play. */
    setDuration(newDuration, now) {
      reanchor(now)
      duration = newDuration
      anchorTime = clamp(anchorTime)
    },

    setRate(newRate, now) {
      if (!(newRate > 0)) throw new Error('Playback rate must be positive')
      reanchor(now)
      rate = newRate
    },
  }
}
