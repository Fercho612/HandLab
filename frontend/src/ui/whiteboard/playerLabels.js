import { playerPosition } from '../../domain/positions.js'
import { Role, Side } from '../../domain/roster.js'

/**
 * Accessible name and shirt label of each player. Positions can repeat, so the accessible name stays numbered
 * per side to tell players apart; the token shows the position.
 */
export function playerLabels(players) {
  const counters = { [Side.ATTACK]: 0, [Side.DEFENSE]: 0 }
  return new Map(
    players.map((player) => {
      const position = playerPosition(player)
      if (player.role === Role.GOALKEEPER) return [player.id, { label: 'Arquero', position }]
      const number = ++counters[player.side]
      const name = player.side === Side.ATTACK ? 'Atacante' : 'Defensor'
      return [player.id, { label: `${name} ${number}`, position }]
    }),
  )
}
