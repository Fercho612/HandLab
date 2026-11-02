import { describe, expect, it } from 'vitest'
import { BallActionType } from './ball.js'
import { createDefaultPlay, playDuration, recordPlayerLayer, replaceFrom } from './play.js'
import { Side, validateRoster } from './roster.js'

describe('replaceFrom', () => {
  const existing = [
    { t: 0, x: 0, y: 0 },
    { t: 3000, x: 3, y: 0 },
    { t: 10000, x: 10, y: 0 },
  ]

  it('keeps what happened before the new recording and drops everything after it starts', () => {
    const recorded = [
      { t: 4000, x: 4, y: 0 },
      { t: 6000, x: 4, y: 5 },
    ]
    expect(replaceFrom(existing, recorded)).toEqual([
      { t: 0, x: 0, y: 0 },
      { t: 3000, x: 3, y: 0 },
      ...recorded,
    ])
  })

  it('replaces the whole trajectory when recording from the start', () => {
    const recorded = [{ t: 0, x: 5, y: 5 }]
    expect(replaceFrom(existing, recorded)).toEqual(recorded)
  })
})

describe('recordPlayerLayer', () => {
  it('replaces the trajectory of the recorded player only', () => {
    const play = createDefaultPlay()
    const [first, second] = play.players
    const recorded = [{ t: 0, x: 1, y: 1 }]

    const updated = recordPlayerLayer(play, first.id, recorded)

    expect(updated.players[0].trajectory).toEqual(recorded)
    expect(updated.players[1]).toBe(second)
    expect(play.players[0]).toBe(first)
  })
})

describe('playDuration', () => {
  it('is zero for a play where nothing moves', () => {
    expect(playDuration(createDefaultPlay())).toBe(0)
  })

  it('is the end of the last recorded player or ball movement', () => {
    const play = recordPlayerLayer(createDefaultPlay(), 'a1', [
      { t: 0, x: 1, y: 1 },
      { t: 2000, x: 2, y: 2 },
    ])
    const withShot = {
      ...play,
      ball: {
        ...play.ball,
        actions: [{ type: BallActionType.SHOT, trajectory: [{ t: 2500, x: 10, y: 9 }, { t: 3100, x: 10, y: -0.5 }] }],
      },
    }
    expect(playDuration(play)).toBe(2000)
    expect(playDuration(withShot)).toBe(3100)
  })
})

describe('createDefaultPlay', () => {
  it('starts with a valid roster and the ball held by an attacker', () => {
    const play = createDefaultPlay()
    const holder = play.players.find((player) => player.id === play.ball.initialHolderId)
    expect(validateRoster(play.players)).toEqual([])
    expect(holder.side).toBe(Side.ATTACK)
    expect(play.ball.actions).toEqual([])
  })
})
