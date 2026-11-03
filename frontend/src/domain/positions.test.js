import { describe, expect, it } from 'vitest'
import { addStep, createDefaultPlay, GOALKEEPER_ID, setFieldPlayerCount, setPlayGoalkeeper, setPlayerPosition } from './play.js'
import { ATTACK_POSITIONS, DEFENSE_POSITIONS, GOALKEEPER_POSITION, playerPosition } from './positions.js'
import { Side } from './roster.js'

const positionsOf = (play, side) =>
  play.players.filter((player) => player.side === side).map((player) => [player.id, playerPosition(player)])

const findPlayer = (play, id) => play.players.find((player) => player.id === id)

describe('player positions', () => {
  it('lists the attack and defense positions', () => {
    expect(ATTACK_POSITIONS).toEqual(['EI', 'LI', 'C', 'LD', 'ED', 'P'])
    expect(DEFENSE_POSITIONS).toEqual(['1I', '2I', '3I', '3D', '2D', '1D'])
  })

  it('starts each player on its own position', () => {
    const play = createDefaultPlay()

    expect(positionsOf(play, Side.ATTACK)).toEqual([
      ['a1', 'EI'],
      ['a2', 'LI'],
      ['a3', 'C'],
      ['a4', 'LD'],
      ['a5', 'ED'],
      ['a6', 'P'],
    ])
    expect(positionsOf(play, Side.DEFENSE)).toEqual([
      ['d1', '1I'],
      ['d2', '2I'],
      ['d3', '3I'],
      ['d4', '3D'],
      ['d5', '2D'],
      ['d6', '1D'],
    ])
  })

  it('gives the goalkeeper its own position', () => {
    const play = setPlayGoalkeeper(createDefaultPlay(), true)
    expect(playerPosition(findPlayer(play, GOALKEEPER_ID))).toBe(GOALKEEPER_POSITION)
  })

  it('changes the position of one player and keeps every step', () => {
    const play = addStep(createDefaultPlay())

    const updated = setPlayerPosition(play, 'a1', 'P')

    expect(playerPosition(findPlayer(updated, 'a1'))).toBe('P')
    expect(playerPosition(findPlayer(updated, 'a2'))).toBe('LI')
    expect(updated.steps).toEqual(play.steps)
  })

  it('lets two players share a position', () => {
    const play = setPlayerPosition(createDefaultPlay(), 'a1', 'C')

    expect(playerPosition(findPlayer(play, 'a1'))).toBe('C')
    expect(playerPosition(findPlayer(play, 'a3'))).toBe('C')
  })

  it('only accepts positions of the player side', () => {
    expect(() => setPlayerPosition(createDefaultPlay(), 'a1', '1I')).toThrow()
    expect(() => setPlayerPosition(createDefaultPlay(), 'd1', 'EI')).toThrow()
    expect(() => setPlayerPosition(createDefaultPlay(), 'a1', 'XX')).toThrow()
  })

  it('does not change the goalkeeper position', () => {
    const play = setPlayGoalkeeper(createDefaultPlay(), true)
    expect(() => setPlayerPosition(play, GOALKEEPER_ID, '1I')).toThrow()
  })

  it('places added players on the position of their number, and a seventh attacker as center', () => {
    const fewer = setFieldPlayerCount(createDefaultPlay(), Side.ATTACK, 4)
    const play = setFieldPlayerCount(fewer, Side.ATTACK, 7)

    expect(positionsOf(play, Side.ATTACK).slice(4)).toEqual([
      ['a5', 'ED'],
      ['a6', 'P'],
      ['a7', 'C'],
    ])
  })
})
