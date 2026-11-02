/**
 * Half court in meters. The goal line is `y = 0` and the half-court line is `y = LENGTH`.
 * The goal is centered on the goal line and extends behind it (`y < 0`).
 */
export const COURT = Object.freeze({ WIDTH: 20, LENGTH: 20 })
export const GOAL = Object.freeze({ CENTER_X: 10, WIDTH: 3, DEPTH: 1 })

/** Where an enabled goalkeeper appears: centered in the goal, just in front of the goal line. */
export const GOALKEEPER_START = Object.freeze({ x: GOAL.CENTER_X, y: 0.5 })

export function clampToCourt({ x, y }) {
  return {
    x: Math.min(Math.max(x, 0), COURT.WIDTH),
    y: Math.min(Math.max(y, 0), COURT.LENGTH),
  }
}

export function isInGoal({ x, y }) {
  const halfWidth = GOAL.WIDTH / 2
  return Math.abs(x - GOAL.CENTER_X) <= halfWidth && y <= 0 && y >= -GOAL.DEPTH
}
