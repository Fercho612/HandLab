import { simplifyTrajectory } from '../domain/simplifyTrajectory.js'

/** Maximum deviation, in meters, that simplification may introduce when a recording finishes. */
export const SIMPLIFY_TOLERANCE = 0.05

/**
 * Records one layer: the `(t, x, y)` samples of a single element while the user drags it,
 * with `t` read from the shared playback clock.
 *
 * @param constrain maps each sampled point to an allowed one (for example `clampToCourt` for players)
 */
export function createTrajectoryRecorder({ constrain = (point) => point, tolerance = SIMPLIFY_TOLERANCE } = {}) {
  let samples = null

  function add(t, point) {
    const { x, y } = constrain(point)
    samples.push({ t, x, y })
  }

  return {
    start(t, point) {
      samples = []
      add(t, point)
    },

    sample(t, point) {
      if (!samples) throw new Error('Recording has not started')
      // Pointer events can repeat a frame timestamp or arrive late; time must strictly increase.
      if (t <= samples[samples.length - 1].t) return
      add(t, point)
    },

    finish() {
      if (!samples) throw new Error('Recording has not started')
      const trajectory = simplifyTrajectory(samples, tolerance)
      samples = null
      return trajectory
    },
  }
}
