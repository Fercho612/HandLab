import { Role, Side } from './roster.js'

/** Attack positions, in the order the default players take them. */
export const ATTACK_POSITIONS = Object.freeze(['EI', 'LI', 'C', 'LD', 'ED', 'P'])
/** Defense positions, in the order the default players take them. */
export const DEFENSE_POSITIONS = Object.freeze(['1I', '2I', '3I', '3D', '2D', '1D'])
/** The goalkeeper's position. There is only one goalkeeper, so it never changes. */
export const GOALKEEPER_POSITION = 'AR'

/** Position of a seventh attacker, who has no position of its own number. */
const EXTRA_ATTACKER_POSITION = 'C'

export const POSITIONS_BY_SIDE = Object.freeze({ [Side.ATTACK]: ATTACK_POSITIONS, [Side.DEFENSE]: DEFENSE_POSITIONS })

/** Starting position of the field player with this number (1-based) on a side. */
export function defaultPosition(side, number) {
  return POSITIONS_BY_SIDE[side][number - 1] ?? EXTRA_ATTACKER_POSITION
}

export function playerPosition(player) {
  return player.role === Role.GOALKEEPER ? GOALKEEPER_POSITION : player.position
}

/** Field players may take any position of their side, even one a teammate already has. */
export function canTakePosition(player, position) {
  return player.role === Role.FIELD && POSITIONS_BY_SIDE[player.side].includes(position)
}
