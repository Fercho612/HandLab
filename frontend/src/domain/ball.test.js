import { describe, expect, it } from 'vitest'
import { BallActionType, heldBallPosition, resolveBallRelease } from './ball.js'

const players = [
  { id: 'a1', side: 'attack', role: 'field' },
  { id: 'a2', side: 'attack', role: 'field' },
  { id: 'a3', side: 'attack', role: 'field' },
]

const positions = {
  a1: { x: 4, y: 10 },
  a2: { x: 14, y: 8 },
  a3: { x: 10, y: 15 },
}

describe('heldBallPosition', () => {
  it('puts the ball in front of an attacker, towards the goal', () => {
    expect(heldBallPosition({ side: 'attack' }, { x: 4, y: 10 })).toEqual({ x: 4, y: 9.5 })
  })

  it('puts the ball in front of a defender, towards the half-court line', () => {
    expect(heldBallPosition({ side: 'defense' }, { x: 4, y: 3 })).toEqual({ x: 4, y: 3.5 })
  })
})

describe('resolveBallRelease', () => {
  it('is a shot when the ball is released inside the goal', () => {
    const release = resolveBallRelease({ players, positions, holderId: 'a2', point: { x: 10, y: -0.25 } })
    expect(release).toEqual({ type: BallActionType.SHOT })
  })

  it('is a pass to the player at the release point', () => {
    const release = resolveBallRelease({ players, positions, holderId: 'a1', point: { x: 14.5, y: 8 } })
    expect(release).toEqual({ type: BallActionType.PASS, toPlayerId: 'a2' })
  })

  it('picks the nearest player when several are within reach', () => {
    const crowdedPlayers = [...players, { id: 'a4', side: 'attack', role: 'field' }]
    const crowdedPositions = { ...positions, a4: { x: 10.8, y: 15 } }
    const release = resolveBallRelease({
      players: crowdedPlayers,
      positions: crowdedPositions,
      holderId: 'a1',
      point: { x: 10.6, y: 15 },
    })
    expect(release).toEqual({ type: BallActionType.PASS, toPlayerId: 'a4' })
  })

  it('is invalid when released far from every player and outside the goal', () => {
    expect(resolveBallRelease({ players, positions, holderId: 'a1', point: { x: 2, y: 2 } })).toBeNull()
  })

  it('is invalid when released back on the holder', () => {
    expect(resolveBallRelease({ players, positions, holderId: 'a1', point: { x: 4, y: 10 } })).toBeNull()
  })
})
