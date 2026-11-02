import { interpolate } from './trajectory.js'

/**
 * Ramer-Douglas-Peucker simplification using the synchronized Euclidean distance:
 * each sample is compared with the position the simplified segment would have at that same `t`.
 * A plain (x, y) RDP would drop the samples of a pause and change the timing of the play.
 *
 * @param trajectory sorted `{ t, x, y }` samples
 * @param tolerance maximum allowed deviation in court meters
 */
export function simplifyTrajectory(trajectory, tolerance) {
  if (trajectory.length <= 2) return trajectory.slice()

  const keep = new Array(trajectory.length).fill(false)
  keep[0] = true
  keep[trajectory.length - 1] = true

  // Iterative instead of recursive: a long drag can produce thousands of samples.
  const segments = [[0, trajectory.length - 1]]
  while (segments.length > 0) {
    const [start, end] = segments.pop()
    let farthestIndex = -1
    let farthestDistance = tolerance

    for (let i = start + 1; i < end; i++) {
      const distance = synchronizedDistance(trajectory[i], trajectory[start], trajectory[end])
      if (distance > farthestDistance) {
        farthestDistance = distance
        farthestIndex = i
      }
    }

    if (farthestIndex !== -1) {
      keep[farthestIndex] = true
      segments.push([start, farthestIndex], [farthestIndex, end])
    }
  }

  return trajectory.filter((_, index) => keep[index])
}

function synchronizedDistance(point, segmentStart, segmentEnd) {
  const expected = interpolate(segmentStart, segmentEnd, point.t)
  return Math.hypot(point.x - expected.x, point.y - expected.y)
}
