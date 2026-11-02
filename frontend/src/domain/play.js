import { heldBallPosition } from './ball.js'
import { GOALKEEPER_START, clampToCourt } from './court.js'
import { Role, Side, setGoalkeeperEnabled } from './roster.js'

/**
 * A play is a sequence of steps (keyframes). Each step stores every player's position and the ball state:
 * `{ holderId }` while a player holds it, or `{ goal: { x, y } }` after a shot.
 * Playback interpolates linearly between consecutive steps.
 *
 * Shape: `{ players: [{ id, side, role }], steps: [{ positions: { [playerId]: { x, y } }, ball }] }`
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

/** Inserts a copy of the step at `index` right after it. */
export function addStep(play, index) {
  const source = play.steps[index]
  const copy = { positions: { ...source.positions }, ball: { ...source.ball } }
  return { ...play, steps: [...play.steps.slice(0, index + 1), copy, ...play.steps.slice(index + 1)] }
}

export function movePlayer(play, stepIndex, playerId, point) {
  return updateStep(play, stepIndex, (step) => ({
    ...step,
    positions: { ...step.positions, [playerId]: clampToCourt(point) },
  }))
}

/**
 * Sets the ball state of a step: a pass (`{ holderId }`) or a shot (`{ goal }`) that happens during the
 * transition into that step. Following steps that still had the previous ball state get the new one too,
 * so the ball does not travel back on its own.
 */
export function moveBall(play, stepIndex, ball) {
  const previous = play.steps[stepIndex].ball
  let propagating = true
  const steps = play.steps.map((step, index) => {
    if (index < stepIndex) return step
    if (index > stepIndex && !(propagating && sameBall(step.ball, previous))) {
      propagating = false
      return step
    }
    return { ...step, ball: { ...ball } }
  })
  return { ...play, steps }
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
      players,
      steps: play.steps.map((step) => ({ ...step, positions: { ...step.positions, [GOALKEEPER_ID]: GOALKEEPER_START } })),
    }
  }

  const fallbackHolder = { holderId: players.find((player) => player.side === Side.ATTACK).id }
  const steps = []
  for (const step of play.steps) {
    const positions = { ...step.positions }
    delete positions[GOALKEEPER_ID]
    const heldByGoalkeeper = step.ball.holderId === GOALKEEPER_ID
    const ball = heldByGoalkeeper ? (steps[steps.length - 1]?.ball ?? fallbackHolder) : step.ball
    steps.push({ positions, ball })
  }
  return { players, steps }
}

/** Erases every step but the first one, keeping the roster (including the goalkeeper setting). */
export function resetPlay(play) {
  return { ...play, steps: [play.steps[0]] }
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
  const players = []
  const positions = {}
  const place = (side, prefix) => (position, index) => {
    const id = `${prefix}${index + 1}`
    players.push({ id, side, role: Role.FIELD })
    positions[id] = position
  }
  DEFAULT_ATTACK.forEach(place(Side.ATTACK, 'a'))
  DEFAULT_DEFENSE.forEach(place(Side.DEFENSE, 'd'))

  return { players, steps: [{ positions, ball: { holderId: 'a3' } }] }
}

function transitionAt(play, t) {
  const last = play.steps.length - 1
  const raw = t / STEP_DURATION
  if (raw >= last) return { from: play.steps[last], to: play.steps[last], progress: 0 }
  const index = Math.max(0, Math.floor(raw))
  return { from: play.steps[index], to: play.steps[index + 1], progress: Math.max(0, raw - index) }
}

function updateStep(play, stepIndex, update) {
  return { ...play, steps: play.steps.map((step, index) => (index === stepIndex ? update(step) : step)) }
}

function sameBall(a, b) {
  if (a.goal || b.goal) return Boolean(a.goal && b.goal) && a.goal.x === b.goal.x && a.goal.y === b.goal.y
  return a.holderId === b.holderId
}

function lerp(from, to, progress) {
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress }
}
