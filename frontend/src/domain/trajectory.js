/**
 * A trajectory is a continuous path sampled while the user drags an element:
 * an array of `{ t, x, y }` points sorted by `t` (milliseconds), with `x`/`y` in court meters.
 */

/**
 * Position of an element at time `t`. Between two samples it interpolates linearly;
 * before the first sample or after the last one it holds that sample's position.
 */
export function positionAt(trajectory, t) {
  if (trajectory.length === 0) {
    throw new Error('Trajectory must have at least one point')
  }

  const first = trajectory[0]
  const last = trajectory[trajectory.length - 1]
  if (t <= first.t) return { x: first.x, y: first.y }
  if (t >= last.t) return { x: last.x, y: last.y }

  // Binary search for the last sample with sample.t <= t (runs every frame, so avoid a linear scan).
  let low = 0
  let high = trajectory.length - 1
  while (high - low > 1) {
    const middle = (low + high) >> 1
    if (trajectory[middle].t <= t) low = middle
    else high = middle
  }

  return interpolate(trajectory[low], trajectory[high], t)
}

export function interpolate(from, to, t) {
  const ratio = (t - from.t) / (to.t - from.t)
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  }
}
