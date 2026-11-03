import { COURT, clampToCourt } from '../../domain/court.js'

/** Space drawn behind the goal line, in meters: 20px on a 640px-wide board (32px per meter). */
const GOAL_SIDE_MARGIN = 0.625
/** Strip of court hidden next to the half-court line, in meters: 50px on a 640px-wide board. */
const CROPPED_LENGTH = 1.5625
const VISIBLE_LENGTH = COURT.LENGTH - CROPPED_LENGTH

export const VIEW_BOX = `0 ${-GOAL_SIDE_MARGIN} ${COURT.WIDTH} ${VISIBLE_LENGTH + GOAL_SIDE_MARGIN}`

/** Players can only be dropped where they stay visible. */
export function clampToVisibleCourt(point) {
  const { x, y } = clampToCourt(point)
  return { x, y: Math.min(y, VISIBLE_LENGTH) }
}
