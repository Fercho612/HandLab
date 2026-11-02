import { Role, Side, setGoalkeeperEnabled } from './roster.js'

export const GOALKEEPER_ID = 'gk'

/**
 * Applies a new recording layer on top of an existing trajectory: what happened before the
 * recording starts is kept, and the recording replaces everything from that moment on.
 */
export function replaceFrom(existing, recorded) {
  const start = recorded[0].t
  return [...existing.filter((point) => point.t < start), ...recorded]
}

export function recordPlayerLayer(play, playerId, recorded) {
  return {
    ...play,
    players: play.players.map((player) =>
      player.id === playerId ? { ...player, trajectory: replaceFrom(player.trajectory, recorded) } : player,
    ),
  }
}

/** Time, in milliseconds, at which the last player or ball movement ends. */
export function playDuration(play) {
  const ends = [
    ...play.players.map((player) => player.trajectory[player.trajectory.length - 1].t),
    ...play.ball.actions.map((action) => action.trajectory[action.trajectory.length - 1].t),
  ]
  return Math.max(0, ...ends)
}

const DEFAULT_ATTACK = [
  { x: 1, y: 1 },
  { x: 4, y: 9.5 },
  { x: 10, y: 10.5 },
  { x: 16, y: 9.5 },
  { x: 19, y: 1 },
  { x: 10, y: 6.6 },
]

const DEFAULT_DEFENSE = [
  { x: 3, y: 3.6 },
  { x: 5.6, y: 5.8 },
  { x: 8.5, y: 6.5 },
  { x: 11.5, y: 6.5 },
  { x: 14.4, y: 5.8 },
  { x: 17, y: 3.6 },
]

/** Starting play: six attackers against a 6-0 defense, without goalkeeper, the center back holding the ball. */
export function createDefaultPlay() {
  const place = (side, prefix) => (position, index) => ({
    id: `${prefix}${index + 1}`,
    side,
    role: Role.FIELD,
    trajectory: [{ t: 0, ...position }],
  })

  return {
    players: [...DEFAULT_ATTACK.map(place(Side.ATTACK, 'a')), ...DEFAULT_DEFENSE.map(place(Side.DEFENSE, 'd'))],
    ball: { initialHolderId: 'a3', actions: [] },
  }
}

/**
 * Turns the optional goalkeeper on or off for a whole play. Disabling it also drops every ball action
 * from the first pass to the goalkeeper on, since the ball cannot stay with a player who left the play.
 */
export function setPlayGoalkeeper(play, enabled) {
  const players = setGoalkeeperEnabled(play.players, enabled, GOALKEEPER_ID)
  if (enabled) return { ...play, players }

  const firstPassToGoalkeeper = play.ball.actions.findIndex((action) => action.toPlayerId === GOALKEEPER_ID)
  const actions = firstPassToGoalkeeper === -1 ? play.ball.actions : play.ball.actions.slice(0, firstPassToGoalkeeper)
  return { ...play, players, ball: { ...play.ball, actions } }
}
