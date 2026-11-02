import { describe, expect, it } from 'vitest'
import { GOALKEEPER_START } from './court.js'
import {
  addStep,
  ballPositionAt,
  createDefaultPlay,
  deleteStep,
  followingSteps,
  GOALKEEPER_ID,
  moveBall,
  movePlayer,
  nearestStep,
  playDuration,
  playerPositionAt,
  resetPlay,
  setPlayGoalkeeper,
  STEP_DURATION,
  stepTime,
} from './play.js'
import { Side, validateRoster } from './roster.js'

const twoSteps = () => addStep(createDefaultPlay())
const threeSteps = () => addStep(twoSteps())

describe('createDefaultPlay', () => {
  it('starts with one step, a valid roster and the ball held by an attacker', () => {
    const play = createDefaultPlay()
    const holder = play.players.find((player) => player.id === play.steps[0].ball.holderId)

    expect(play.steps).toHaveLength(1)
    expect(validateRoster(play.players)).toEqual([])
    expect(holder.side).toBe(Side.ATTACK)
    expect(playDuration(play)).toBe(0)
  })
})

describe('addStep', () => {
  it('appends a copy of the last step', () => {
    const play = addStep(movePlayer(twoSteps(), 1, 'a1', { x: 5, y: 5 }))
    expect(play.steps).toHaveLength(3)
    expect(play.steps[2]).toEqual(play.steps[1])
    expect(play.steps[2]).not.toBe(play.steps[1])
  })
})

describe('playDuration and step times', () => {
  it('lasts one transition per extra step', () => {
    expect(playDuration(threeSteps())).toBe(2 * STEP_DURATION)
    expect(stepTime(2)).toBe(2 * STEP_DURATION)
  })

  it('finds the step nearest to a time', () => {
    const play = threeSteps()
    expect(nearestStep(play, 400)).toBe(0)
    expect(nearestStep(play, 600)).toBe(1)
    expect(nearestStep(play, 99999)).toBe(2)
  })

  it('counts the steps after a step', () => {
    expect(followingSteps(threeSteps(), 0)).toBe(2)
    expect(followingSteps(threeSteps(), 2)).toBe(0)
  })
})

describe('movePlayer', () => {
  it('changes the player position in that step only', () => {
    const play = movePlayer(twoSteps(), 1, 'a1', { x: 5, y: 1 })
    expect(play.steps[0].positions.a1).toEqual({ x: 1, y: 1 })
    expect(play.steps[1].positions.a1).toEqual({ x: 5, y: 1 })
  })

  it('keeps the player inside the court', () => {
    const play = movePlayer(twoSteps(), 1, 'a1', { x: -3, y: 25 })
    expect(play.steps[1].positions.a1).toEqual({ x: 0, y: 20 })
  })

  it('deletes the steps after the modified one', () => {
    const play = movePlayer(threeSteps(), 0, 'a1', { x: 2, y: 2 })
    expect(play.steps).toHaveLength(1)
    expect(play.steps[0].positions.a1).toEqual({ x: 2, y: 2 })
  })
})

describe('playerPositionAt', () => {
  const play = movePlayer(twoSteps(), 1, 'a1', { x: 5, y: 3 })

  it('is the step position at the step time', () => {
    expect(playerPositionAt(play, 'a1', 0)).toEqual({ x: 1, y: 1 })
    expect(playerPositionAt(play, 'a1', STEP_DURATION)).toEqual({ x: 5, y: 3 })
  })

  it('interpolates linearly during the transition', () => {
    expect(playerPositionAt(play, 'a1', STEP_DURATION / 2)).toEqual({ x: 3, y: 2 })
  })

  it('holds the first and last steps outside the play', () => {
    expect(playerPositionAt(play, 'a1', -100)).toEqual({ x: 1, y: 1 })
    expect(playerPositionAt(play, 'a1', 5000)).toEqual({ x: 5, y: 3 })
  })
})

describe('ballPositionAt', () => {
  it('stays in front of its holder, following them', () => {
    const play = movePlayer(twoSteps(), 1, 'a3', { x: 12, y: 10.5 })
    expect(ballPositionAt(play, 0)).toEqual({ x: 10, y: 10 })
    expect(ballPositionAt(play, STEP_DURATION / 2)).toEqual({ x: 11, y: 10 })
  })

  it('flies from the passer to the receiver during the transition', () => {
    const play = moveBall(twoSteps(), 1, { holderId: 'a4' })
    // a3 holds the ball at (10, 10); a4 at (16, 9.5) holds it at (16, 9).
    expect(ballPositionAt(play, STEP_DURATION / 2)).toEqual({ x: 13, y: 9.5 })
    expect(ballPositionAt(play, STEP_DURATION)).toEqual({ x: 16, y: 9 })
  })

  it('flies into the goal on a shot and stays there', () => {
    const play = addStep(moveBall(twoSteps(), 1, { goal: { x: 10, y: -0.25 } }))
    expect(ballPositionAt(play, STEP_DURATION / 2)).toEqual({ x: 10, y: 4.875 })
    expect(ballPositionAt(play, 2 * STEP_DURATION)).toEqual({ x: 10, y: -0.25 })
  })
})

describe('moveBall', () => {
  it('sets the ball state of the step', () => {
    const play = moveBall(twoSteps(), 1, { holderId: 'a4' })
    expect(play.steps.map((step) => step.ball)).toEqual([{ holderId: 'a3' }, { holderId: 'a4' }])
  })

  it('deletes the steps after the modified one', () => {
    const play = moveBall(threeSteps(), 1, { holderId: 'a4' })
    expect(play.steps).toHaveLength(2)
  })
})

describe('deleteStep', () => {
  it('deletes the step and every step after it', () => {
    const play = deleteStep(movePlayer(addStep(threeSteps()), 1, 'a1', { x: 4, y: 4 }), 2)
    expect(play.steps).toHaveLength(2)
    expect(play.steps[1].positions.a1).toEqual({ x: 4, y: 4 })
  })

  it('does not delete the starting step', () => {
    expect(() => deleteStep(twoSteps(), 0)).toThrow('The starting step cannot be deleted')
  })
})

describe('setPlayGoalkeeper', () => {
  it('adds the goalkeeper in the goal in every step when enabled', () => {
    const play = setPlayGoalkeeper(twoSteps(), true)
    expect(play.players.some((player) => player.id === GOALKEEPER_ID)).toBe(true)
    expect(play.steps.map((step) => step.positions[GOALKEEPER_ID])).toEqual([GOALKEEPER_START, GOALKEEPER_START])
  })

  it('removes the goalkeeper and gives the ball back to whoever had it before', () => {
    const play = addStep(moveBall(setPlayGoalkeeper(twoSteps(), true), 1, { holderId: GOALKEEPER_ID }))

    const updated = setPlayGoalkeeper(play, false)

    expect(updated.players.some((player) => player.id === GOALKEEPER_ID)).toBe(false)
    expect(updated.steps.every((step) => !(GOALKEEPER_ID in step.positions))).toBe(true)
    expect(updated.steps.map((step) => step.ball)).toEqual([{ holderId: 'a3' }, { holderId: 'a3' }, { holderId: 'a3' }])
  })
})

describe('resetPlay', () => {
  it('keeps only the first step', () => {
    const play = moveBall(movePlayer(threeSteps(), 2, 'a1', { x: 6, y: 4 }), 2, { holderId: 'a4' })
    expect(resetPlay(play)).toEqual(createDefaultPlay())
  })

  it('keeps the goalkeeper setting', () => {
    const play = setPlayGoalkeeper(twoSteps(), true)
    expect(resetPlay(play)).toEqual(setPlayGoalkeeper(createDefaultPlay(), true))
  })
})
