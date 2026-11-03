import { heldBallPosition } from './ball.js'
import { GOALKEEPER_START, clampToCourt } from './court.js'
import { COURT_STYLES, DEFAULT_COURT_STYLE } from './courtStyles.js'
import { canTakePosition, defaultPosition } from './positions.js'
import { MAX_DEFENSE_FIELD_PLAYERS, MAX_PLAYERS_PER_SIDE, MIN_PLAYERS_PER_SIDE, Role, Side, setGoalkeeperEnabled } from './roster.js'
import { DEFAULT_TEAM_COLORS, isTeamColorAvailable } from './teamColors.js'

/**
 * A play is a sequence of steps (keyframes). Each step stores every player's position and the ball state:
 * `{ holderId }` while a player holds it, or `{ goal: { x, y } }` after a shot.
 * Playback interpolates linearly between consecutive steps.
 *
 * Shape: `{ players: [{ id, side, role, position }], teamColors: { attack, defense }, courtStyle, steps: [{ positions: { [playerId]: { x, y } }, ball }] }`
 */

/** Duration, in milliseconds, of the transition between two consecutive steps. */
export const STEP_DURATION = 1000
export const GOALKEEPER_ID = 'gk'

export const stepTime = (index) => index * STEP_DURATION
export const playDuration = (play) => stepTime(play.steps.length - 1)

export function nearestStep(play, t) {
  const index = Math.round(t / STEP_DURATION)
  return Math.min(Math.max(index, 0), play.steps.length - 1)
}

export const followingSteps = (play, index) => play.steps.length - 1 - index

/** Appends a copy of the last step. */
export function addStep(play) {
  const last = play.steps[play.steps.length - 1]
  return { ...play, steps: [...play.steps, { positions: { ...last.positions }, ball: { ...last.ball } }] }
}

/** Deletes the step and every step after it. The starting step always stays. */
export function deleteStep(play, index) {
  if (index === 0) throw new Error('The starting step cannot be deleted')
  return { ...play, steps: play.steps.slice(0, index) }
}

/** Moves a player in a step. Modifying a step deletes the steps after it. */
export function movePlayer(play, stepIndex, playerId, point) {
  return updateStep(play, stepIndex, (step) => ({
    ...step,
    positions: { ...step.positions, [playerId]: clampToCourt(point) },
  }))
}

/**
 * Sets the ball state of a step: a pass (`{ holderId }`) or a shot (`{ goal }`) that happens during the
 * transition into that step. Modifying a step deletes the steps after it.
 */
export function moveBall(play, stepIndex, ball) {
  return updateStep(play, stepIndex, (step) => ({ ...step, ball: { ...ball } }))
}

export function playerPositionAt(play, playerId, t) {
  const { from, to, progress } = transitionAt(play, t)
  return lerp(from.positions[playerId], to.positions[playerId], progress)
}

/** Where the ball is drawn at `t`: in front of its holder, flying between two steps, or in the goal. */
export function ballPositionAt(play, t) {
  const { from, to, progress } = transitionAt(play, t)
  const ballSpot = (ball) => {
    if (ball.goal) return ball.goal
    const holder = play.players.find((player) => player.id === ball.holderId)
    return heldBallPosition(holder, playerPositionAt(play, holder.id, t))
  }
  if (sameBall(from.ball, to.ball)) return ballSpot(from.ball)
  return lerp(ballSpot(from.ball), ballSpot(to.ball), progress)
}

/**
 * Turns the optional goalkeeper on or off. When enabled it appears in the goal in every step; when disabled,
 * steps where it held the ball give the ball back to whoever had it in the previous step.
 */
export function setPlayGoalkeeper(play, enabled) {
  const players = setGoalkeeperEnabled(play.players, enabled, GOALKEEPER_ID)
  if (enabled) {
    if (players === play.players) return play
    return {
      ...play,
      players,
      steps: play.steps.map((step) => ({ ...step, positions: { ...step.positions, [GOALKEEPER_ID]: GOALKEEPER_START } })),
    }
  }

  return { ...play, players, steps: removeFromSteps(play.steps, GOALKEEPER_ID, players) }
}

/** How many field players each side may have. The goalkeeper is counted apart, so the defense stops at 6. */
export const FIELD_PLAYER_LIMITS = Object.freeze({
  [Side.ATTACK]: Object.freeze({ min: MIN_PLAYERS_PER_SIDE, max: MAX_PLAYERS_PER_SIDE }),
  [Side.DEFENSE]: Object.freeze({ min: MIN_PLAYERS_PER_SIDE, max: MAX_DEFENSE_FIELD_PLAYERS }),
})

/**
 * Sets how many field players a side has. New players appear on their starting spot in every step; removed
 * players are the highest-numbered ones, and steps where they held the ball give it back as for the goalkeeper.
 */
export function setFieldPlayerCount(play, side, count) {
  const { min, max } = FIELD_PLAYER_LIMITS[side]
  if (!Number.isInteger(count) || count < min || count > max) throw new Error(`Field player count out of range: ${count}`)

  const isField = (player) => player.side === side && player.role === Role.FIELD
  const current = play.players.filter(isField).length
  let { players, steps } = play

  for (let number = current + 1; number <= count; number++) {
    const id = fieldPlayerId(side, number)
    const start = DEFAULT_POSITIONS[side][number - 1]
    players = [...players, { id, side, role: Role.FIELD, position: defaultPosition(side, number) }]
    steps = steps.map((step) => ({ ...step, positions: { ...step.positions, [id]: start } }))
  }
  for (let number = current; number > count; number--) {
    const id = fieldPlayerId(side, number)
    players = players.filter((player) => player.id !== id)
    steps = removeFromSteps(steps, id, players)
  }
  return { ...play, players, steps }
}

/** Changes the position a field player plays. It applies to the whole play, so no step is touched. */
export function setPlayerPosition(play, playerId, position) {
  const player = play.players.find((candidate) => candidate.id === playerId)
  if (!player || !canTakePosition(player, position)) throw new Error(`Position not available for ${playerId}: ${position}`)
  return { ...play, players: play.players.map((candidate) => (candidate === player ? { ...player, position } : candidate)) }
}

/** Changes how the court is drawn. */
export function setCourtStyle(play, courtStyle) {
  if (!COURT_STYLES.includes(courtStyle)) throw new Error(`Unknown court style: ${courtStyle}`)
  return { ...play, courtStyle }
}

/** Changes the color of one team. Both teams can never wear the same color. */
export function setTeamColor(play, side, color) {
  if (!isTeamColorAvailable(play.teamColors, side, color)) throw new Error(`Color not available for ${side}: ${color}`)
  return { ...play, teamColors: { ...play.teamColors, [side]: color } }
}

/** Erases every step but the first one, keeping the roster (including the goalkeeper setting). */
export function resetPlay(play) {
  return { ...play, steps: [play.steps[0]] }
}

const fieldPlayerId = (side, number) => `${side === Side.ATTACK ? 'a' : 'd'}${number}`

const DEFAULT_ATTACK = [
  { x: 1, y: 1 },
  { x: 4, y: 9.5 },
  { x: 10, y: 10.5 },
  { x: 16, y: 9.5 },
  { x: 19, y: 1 },
  { x: 10, y: 6.6 },
  { x: 10, y: 14.5 },
]

const DEFAULT_DEFENSE = [
  { x: 3, y: 3.6 },
  { x: 5.6, y: 5.8 },
  { x: 8.5, y: 6.5 },
  { x: 11.5, y: 6.5 },
  { x: 14.4, y: 5.8 },
  { x: 17, y: 3.6 },
]

/** Starting spot of each field player, by side and number (index 0 is player 1). */
const DEFAULT_POSITIONS = { [Side.ATTACK]: DEFAULT_ATTACK, [Side.DEFENSE]: DEFAULT_DEFENSE }
const DEFAULT_ATTACK_COUNT = 6

/** Starting play: six attackers against a 6-0 defense, without goalkeeper, the center back holding the ball. */
export function createDefaultPlay() {
  const players = []
  const positions = {}
  const place = (side, prefix) => (position, index) => {
    const id = `${prefix}${index + 1}`
    players.push({ id, side, role: Role.FIELD, position: defaultPosition(side, index + 1) })
    positions[id] = position
  }
  DEFAULT_ATTACK.slice(0, DEFAULT_ATTACK_COUNT).forEach(place(Side.ATTACK, 'a'))
  DEFAULT_DEFENSE.forEach(place(Side.DEFENSE, 'd'))

  return { players, teamColors: { ...DEFAULT_TEAM_COLORS }, courtStyle: DEFAULT_COURT_STYLE, steps: [{ positions, ball: { holderId: 'a3' } }] }
}

/**
 * Removes a player from every step. Steps where it held the ball give the ball back to whoever had it in the
 * previous step, or to the first remaining attacker in the starting step.
 */
function removeFromSteps(steps, playerId, remainingPlayers) {
  const fallbackHolder = { holderId: remainingPlayers.find((player) => player.side === Side.ATTACK).id }
  const result = []
  for (const step of steps) {
    const positions = { ...step.positions }
    delete positions[playerId]
    const heldByRemoved = step.ball.holderId === playerId
    const ball = heldByRemoved ? (result[result.length - 1]?.ball ?? fallbackHolder) : step.ball
    result.push({ positions, ball })
  }
  return result
}

function transitionAt(play, t) {
  const last = play.steps.length - 1
  const raw = t / STEP_DURATION
  if (raw >= last) return { from: play.steps[last], to: play.steps[last], progress: 0 }
  const index = Math.max(0, Math.floor(raw))
  return { from: play.steps[index], to: play.steps[index + 1], progress: Math.max(0, raw - index) }
}

function updateStep(play, stepIndex, update) {
  const steps = play.steps.slice(0, stepIndex + 1)
  steps[stepIndex] = update(steps[stepIndex])
  return { ...play, steps }
}

function sameBall(a, b) {
  if (a.goal || b.goal) return Boolean(a.goal && b.goal) && a.goal.x === b.goal.x && a.goal.y === b.goal.y
  return a.holderId === b.holderId
}

function lerp(from, to, progress) {
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress }
}
