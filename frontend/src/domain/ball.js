import { isInGoal } from './court.js'
import { positionAt } from './trajectory.js'

export const BallActionType = Object.freeze({ PASS: 'pass', SHOT: 'shot' })

/** Maximum distance, in meters, between the release point and a player for the pass to reach them. */
export const CATCH_RADIUS = 1

/**
 * The ball is held by a player and follows them. It only moves on its own when the user drags it:
 * a pass (ends with another player, who becomes the holder) or a shot (ends in the goal).
 *
 * @param ball `{ initialHolderId, actions }`, actions sorted by start time; each has a `trajectory`,
 *   and passes also have `toPlayerId`
 * @param players `{ id, trajectory }[]`
 */
export function ballPositionAt(ball, players, t) {
  const action = lastActionStartedBy(ball.actions, t)
  if (!action) return holderPositionAt(players, ball.initialHolderId, t)

  const flightEnd = action.trajectory[action.trajectory.length - 1].t
  if (t <= flightEnd || action.type === BallActionType.SHOT) {
    return positionAt(action.trajectory, t)
  }
  return holderPositionAt(players, action.toPlayerId, t)
}

/**
 * Decides what releasing the dragged ball at `point` and time `t` means.
 * Returns a shot, a pass to the nearest other player within reach, or `null` when the release is invalid.
 */
export function resolveBallRelease({ players, holderId, point, t }) {
  if (isInGoal(point)) return { type: BallActionType.SHOT }

  let receiverId = null
  let nearestDistance = CATCH_RADIUS
  for (const player of players) {
    if (player.id === holderId) continue
    const position = positionAt(player.trajectory, t)
    const distance = Math.hypot(position.x - point.x, position.y - point.y)
    if (distance <= nearestDistance) {
      nearestDistance = distance
      receiverId = player.id
    }
  }

  return receiverId ? { type: BallActionType.PASS, toPlayerId: receiverId } : null
}

/** Id of the player holding the ball at `t`, or `null` while it flies or after a shot. */
export function ballHolderAt(ball, t) {
  const action = lastActionStartedBy(ball.actions, t)
  if (!action) return ball.initialHolderId
  if (action.type === BallActionType.SHOT) return null

  const flightEnd = action.trajectory[action.trajectory.length - 1].t
  return t > flightEnd ? action.toPlayerId : null
}

/**
 * Adds a recorded pass or shot. Like player layers, a new recording replaces
 * everything the ball did from the moment it starts.
 */
export function recordBallAction(ball, action) {
  const start = action.trajectory[0].t
  return {
    ...ball,
    actions: [...ball.actions.filter((existing) => existing.trajectory[0].t < start), action],
  }
}

function lastActionStartedBy(actions, t) {
  for (let i = actions.length - 1; i >= 0; i--) {
    if (actions[i].trajectory[0].t <= t) return actions[i]
  }
  return null
}

function holderPositionAt(players, holderId, t) {
  const holder = players.find((player) => player.id === holderId)
  if (!holder) throw new Error(`Ball holder ${holderId} is not in the play`)
  return positionAt(holder.trajectory, t)
}
