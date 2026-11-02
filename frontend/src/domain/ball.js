import { isInGoal } from './court.js'

export const BallActionType = Object.freeze({ PASS: 'pass', SHOT: 'shot' })

/** Maximum distance, in meters, between the release point and a player for the pass to reach them. */
export const CATCH_RADIUS = 1

/**
 * A held ball sits in front of its holder, overlapping the marker a little.
 * Attackers face the goal (towards y = 0); defenders and the goalkeeper face the half-court line.
 */
const HELD_BALL_OFFSET = Object.freeze({ attack: { x: 0, y: -0.5 }, defense: { x: 0, y: 0.5 } })

export function heldBallPosition(player, position) {
  const offset = HELD_BALL_OFFSET[player.side]
  return { x: position.x + offset.x, y: position.y + offset.y }
}

/**
 * Decides what releasing the dragged ball at `point` means, given the player positions of the edited step.
 * Returns a shot, a pass to the nearest other player within reach, or `null` when the release is invalid.
 */
export function resolveBallRelease({ players, positions, holderId, point }) {
  if (isInGoal(point)) return { type: BallActionType.SHOT }

  let receiverId = null
  let nearestDistance = CATCH_RADIUS
  for (const player of players) {
    if (player.id === holderId) continue
    const position = positions[player.id]
    const distance = Math.hypot(position.x - point.x, position.y - point.y)
    if (distance <= nearestDistance) {
      nearestDistance = distance
      receiverId = player.id
    }
  }

  return receiverId ? { type: BallActionType.PASS, toPlayerId: receiverId } : null
}
