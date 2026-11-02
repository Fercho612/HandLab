import { describe, expect, it } from 'vitest'
import { RosterError, setGoalkeeperEnabled, validateRoster } from './roster.js'

const attacker = (id) => ({ id, side: 'attack', role: 'field' })
const defender = (id) => ({ id, side: 'defense', role: 'field' })
const goalkeeper = (id) => ({ id, side: 'defense', role: 'goalkeeper' })

const many = (factory, count, prefix) =>
  Array.from({ length: count }, (_, i) => factory(`${prefix}${i}`))

describe('validateRoster', () => {
  it('accepts a full 7 vs 6 + goalkeeper roster', () => {
    const players = [...many(attacker, 7, 'a'), ...many(defender, 6, 'd'), goalkeeper('gk')]
    expect(validateRoster(players)).toEqual([])
  })

  it('accepts a defense without goalkeeper', () => {
    const players = [...many(attacker, 7, 'a'), ...many(defender, 6, 'd')]
    expect(validateRoster(players)).toEqual([])
  })

  it('accepts the goalkeeper as the only defender', () => {
    expect(validateRoster([attacker('a'), goalkeeper('gk')])).toEqual([])
  })

  it('requires at least one attacker', () => {
    expect(validateRoster([defender('d')])).toEqual([RosterError.ATTACK_TOO_FEW])
  })

  it('rejects more than seven attackers', () => {
    const players = [...many(attacker, 8, 'a'), defender('d')]
    expect(validateRoster(players)).toEqual([RosterError.ATTACK_TOO_MANY])
  })

  it('requires at least one defender', () => {
    expect(validateRoster([attacker('a')])).toEqual([RosterError.DEFENSE_TOO_FEW])
  })

  it('rejects more than six defensive field players', () => {
    const players = [attacker('a'), ...many(defender, 7, 'd')]
    expect(validateRoster(players)).toEqual([RosterError.DEFENSE_FIELD_TOO_MANY])
  })

  it('rejects a second goalkeeper', () => {
    expect(validateRoster([attacker('a'), goalkeeper('gk1'), goalkeeper('gk2')])).toEqual([
      RosterError.DEFENSE_SINGLE_GOALKEEPER,
    ])
  })
})

describe('setGoalkeeperEnabled', () => {
  const players = [attacker('a'), defender('d')]

  it('adds a goalkeeper when enabled', () => {
    expect(setGoalkeeperEnabled(players, true, 'gk')).toEqual([
      ...players,
      { id: 'gk', side: 'defense', role: 'goalkeeper' },
    ])
  })

  it('does not add a second goalkeeper when one is already enabled', () => {
    const withGoalkeeper = setGoalkeeperEnabled(players, true, 'gk')
    expect(setGoalkeeperEnabled(withGoalkeeper, true, 'gk2')).toEqual(withGoalkeeper)
  })

  it('removes the goalkeeper when disabled', () => {
    const withGoalkeeper = setGoalkeeperEnabled(players, true, 'gk')
    expect(setGoalkeeperEnabled(withGoalkeeper, false)).toEqual(players)
  })
})
