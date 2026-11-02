export const Side = Object.freeze({ ATTACK: 'attack', DEFENSE: 'defense' })
export const Role = Object.freeze({ FIELD: 'field', GOALKEEPER: 'goalkeeper' })

export const MIN_PLAYERS_PER_SIDE = 1
export const MAX_PLAYERS_PER_SIDE = 7
export const MAX_DEFENSE_FIELD_PLAYERS = 6

/** Error codes; the UI maps them to user-facing messages. */
export const RosterError = Object.freeze({
  ATTACK_TOO_FEW: 'attack-too-few',
  ATTACK_TOO_MANY: 'attack-too-many',
  DEFENSE_TOO_FEW: 'defense-too-few',
  DEFENSE_TOO_MANY: 'defense-too-many',
  DEFENSE_FIELD_TOO_MANY: 'defense-field-too-many',
  DEFENSE_GOALKEEPER_REQUIRED: 'defense-goalkeeper-required',
  DEFENSE_SINGLE_GOALKEEPER: 'defense-single-goalkeeper',
})

/**
 * Validates the players of a play. Each player is `{ id, side, role }`.
 * Returns the list of broken rules; an empty list means the roster is valid.
 */
export function validateRoster(players) {
  const attack = players.filter((player) => player.side === Side.ATTACK)
  const defense = players.filter((player) => player.side === Side.DEFENSE)
  const goalkeepers = defense.filter((player) => player.role === Role.GOALKEEPER)
  const defenseFieldPlayers = defense.length - goalkeepers.length

  const errors = []
  if (attack.length < MIN_PLAYERS_PER_SIDE) errors.push(RosterError.ATTACK_TOO_FEW)
  if (attack.length > MAX_PLAYERS_PER_SIDE) errors.push(RosterError.ATTACK_TOO_MANY)
  if (defense.length < MIN_PLAYERS_PER_SIDE) errors.push(RosterError.DEFENSE_TOO_FEW)
  if (defense.length > MAX_PLAYERS_PER_SIDE) errors.push(RosterError.DEFENSE_TOO_MANY)
  if (defenseFieldPlayers > MAX_DEFENSE_FIELD_PLAYERS) errors.push(RosterError.DEFENSE_FIELD_TOO_MANY)
  if (goalkeepers.length === 0) errors.push(RosterError.DEFENSE_GOALKEEPER_REQUIRED)
  if (goalkeepers.length > 1) errors.push(RosterError.DEFENSE_SINGLE_GOALKEEPER)
  return errors
}
