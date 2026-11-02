import { describe, expect, it } from 'vitest'
import { RosterError, validateRoster } from './roster.js'

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

  it('accepts the minimum: one attacker and the goalkeeper', () => {
    expect(validateRoster([attacker('a'), goalkeeper('gk')])).toEqual([])
  })

  it('requires at least one player per side', () => {
    expect(validateRoster([goalkeeper('gk')])).toEqual([RosterError.ATTACK_TOO_FEW])
  })

  it('rejects more than seven attackers', () => {
    const players = [...many(attacker, 8, 'a'), goalkeeper('gk')]
    expect(validateRoster(players)).toEqual([RosterError.ATTACK_TOO_MANY])
  })

  it('requires the defense to have a goalkeeper', () => {
    expect(validateRoster([attacker('a'), defender('d')])).toEqual([
      RosterError.DEFENSE_GOALKEEPER_REQUIRED,
    ])
  })

  it('rejects an empty defense', () => {
    expect(validateRoster([attacker('a')])).toEqual([
      RosterError.DEFENSE_TOO_FEW,
      RosterError.DEFENSE_GOALKEEPER_REQUIRED,
    ])
  })

  it('rejects a second goalkeeper', () => {
    expect(validateRoster([attacker('a'), goalkeeper('gk1'), goalkeeper('gk2')])).toEqual([
      RosterError.DEFENSE_SINGLE_GOALKEEPER,
    ])
  })

  it('rejects more than six defensive field players', () => {
    const players = [attacker('a'), ...many(defender, 7, 'd'), goalkeeper('gk')]
    expect(validateRoster(players)).toEqual([
      RosterError.DEFENSE_TOO_MANY,
      RosterError.DEFENSE_FIELD_TOO_MANY,
    ])
  })
})
