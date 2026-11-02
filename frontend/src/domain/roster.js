import { GOALKEEPER_START } from './court.js'

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
  DEFENSE_FIELD_TOO_MANY: 'defense-field-too-many',
  DEFENSE_SINGLE_GOALKEEPER: 'defense-single-goalkeeper',
})

/**
 * Validates the players of a play. Each player is `{ id, side, role }`.
 * The goalkeeper is optional, so the defense has at most 6 field players plus one goalkeeper.
 * Returns the list of broken rules; an empty list means the roster is valid.
 */
export function validateRoster(players) {
  const attack = players.filter((player) => player.side === Side.ATTACK)
  const defense = players.filter((player) => player.side === Side.DEFENSE)
  const goalkeepers = defense.filter(isGoalkeeper)
  const defenseFieldPlayers = defense.length - goalkeepers.length

  const errors = []
  if (attack.length < MIN_PLAYERS_PER_SIDE) errors.push(RosterError.ATTACK_TOO_FEW)
  if (attack.length > MAX_PLAYERS_PER_SIDE) errors.push(RosterError.ATTACK_TOO_MANY)
  if (defense.length < MIN_PLAYERS_PER_SIDE) errors.push(RosterError.DEFENSE_TOO_FEW)
  if (defenseFieldPlayers > MAX_DEFENSE_FIELD_PLAYERS) errors.push(RosterError.DEFENSE_FIELD_TOO_MANY)
  if (goalkeepers.length > 1) errors.push(RosterError.DEFENSE_SINGLE_GOALKEEPER)
  return errors
}

/**
 * Turns the optional goalkeeper on or off. An enabled goalkeeper appears directly in the goal.
 * Returns a new players array; enabling twice keeps the existing goalkeeper.
 */
export function setGoalkeeperEnabled(players, enabled, goalkeeperId) {
  const hasGoalkeeper = players.some(isGoalkeeper)
  if (!enabled) return players.filter((player) => !isGoalkeeper(player))
  if (hasGoalkeeper) return players
  return [
    ...players,
    {
      id: goalkeeperId,
      side: Side.DEFENSE,
      role: Role.GOALKEEPER,
      trajectory: [{ t: 0, ...GOALKEEPER_START }],
    },
  ]
}

function isGoalkeeper(player) {
  return player.side === Side.DEFENSE && player.role === Role.GOALKEEPER
}
