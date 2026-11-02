import { describe, expect, it } from 'vitest'
import { BallActionType, ballHolderAt, ballPositionAt, recordBallAction, resolveBallRelease } from './ball.js'

const players = [
  {
    id: 'a1',
    trajectory: [
      { t: 0, x: 4, y: 10 },
      { t: 1000, x: 6, y: 10 },
    ],
  },
  {
    id: 'a2',
    trajectory: [
      { t: 0, x: 14, y: 10 },
      { t: 2000, x: 14, y: 6 },
    ],
  },
  { id: 'a3', trajectory: [{ t: 0, x: 10, y: 15 }] },
]

const pass = {
  type: BallActionType.PASS,
  toPlayerId: 'a2',
  trajectory: [
    { t: 1000, x: 6, y: 10 },
    { t: 1500, x: 14, y: 8 },
  ],
}

const shot = {
  type: BallActionType.SHOT,
  trajectory: [
    { t: 2500, x: 14, y: 6 },
    { t: 2800, x: 10, y: -0.5 },
  ],
}

describe('ballPositionAt', () => {
  it('follows the initial holder while nobody passes', () => {
    const ball = { initialHolderId: 'a1', actions: [] }
    expect(ballPositionAt(ball, players, 500)).toEqual({ x: 5, y: 10 })
  })

  it('follows its own trajectory during a pass', () => {
    const ball = { initialHolderId: 'a1', actions: [pass] }
    expect(ballPositionAt(ball, players, 1250)).toEqual({ x: 10, y: 9 })
  })

  it('follows the receiver after the pass', () => {
    const ball = { initialHolderId: 'a1', actions: [pass] }
    expect(ballPositionAt(ball, players, 2000)).toEqual({ x: 14, y: 6 })
  })

  it('stays in the goal after a shot', () => {
    const ball = { initialHolderId: 'a1', actions: [pass, shot] }
    expect(ballPositionAt(ball, players, 2650)).toEqual({ x: 12, y: 2.75 })
    expect(ballPositionAt(ball, players, 9000)).toEqual({ x: 10, y: -0.5 })
  })
})

describe('resolveBallRelease', () => {
  it('is a shot when the ball is released inside the goal', () => {
    const release = resolveBallRelease({ players, holderId: 'a2', point: { x: 10, y: -0.5 }, t: 2800 })
    expect(release).toEqual({ type: BallActionType.SHOT })
  })

  it('is a pass to the player at the release point at that time', () => {
    const release = resolveBallRelease({ players, holderId: 'a1', point: { x: 14.5, y: 8 }, t: 1000 })
    expect(release).toEqual({ type: BallActionType.PASS, toPlayerId: 'a2' })
  })

  it('picks the nearest player when several are within reach', () => {
    const crowded = [...players, { id: 'a4', trajectory: [{ t: 0, x: 10.8, y: 15 }] }]
    const release = resolveBallRelease({ players: crowded, holderId: 'a1', point: { x: 10.6, y: 15 }, t: 0 })
    expect(release).toEqual({ type: BallActionType.PASS, toPlayerId: 'a4' })
  })

  it('is invalid when released far from every player and outside the goal', () => {
    expect(resolveBallRelease({ players, holderId: 'a1', point: { x: 2, y: 2 }, t: 0 })).toBeNull()
  })

  it('is invalid when released back on the holder', () => {
    expect(resolveBallRelease({ players, holderId: 'a1', point: { x: 4, y: 10 }, t: 0 })).toBeNull()
  })
})

describe('ballHolderAt', () => {
  const ball = { initialHolderId: 'a1', actions: [pass, shot] }

  it('is the initial holder before any action', () => {
    expect(ballHolderAt(ball, 500)).toBe('a1')
  })

  it('is nobody while the ball is in flight', () => {
    expect(ballHolderAt(ball, 1200)).toBeNull()
  })

  it('is the receiver after a pass', () => {
    expect(ballHolderAt(ball, 2000)).toBe('a2')
  })

  it('is nobody after a shot', () => {
    expect(ballHolderAt(ball, 9000)).toBeNull()
  })
})

describe('recordBallAction', () => {
  it('appends the action to the ball', () => {
    const ball = { initialHolderId: 'a1', actions: [pass] }
    expect(recordBallAction(ball, shot)).toEqual({ initialHolderId: 'a1', actions: [pass, shot] })
  })

  it('replaces every action that started at or after the new one', () => {
    const ball = { initialHolderId: 'a1', actions: [pass, shot] }
    const earlyShot = { type: BallActionType.SHOT, trajectory: [{ t: 500, x: 5, y: 10 }, { t: 900, x: 10, y: -0.5 }] }
    expect(recordBallAction(ball, earlyShot)).toEqual({ initialHolderId: 'a1', actions: [earlyShot] })
  })
})
