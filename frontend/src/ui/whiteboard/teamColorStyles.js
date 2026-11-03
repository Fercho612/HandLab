import { Role } from '../../domain/roster.js'
import { TeamColor } from '../../domain/teamColors.js'

/** How each team color is drawn: its Spanish name, the token fill, the number ink and the token outline. */
export const TEAM_COLOR_STYLES = Object.freeze({
  [TeamColor.RED]: { name: 'Rojo', fill: '#d23c3c', ink: '#ffffff', stroke: '#ffffff' },
  [TeamColor.BLUE]: { name: 'Azul', fill: '#2a5caa', ink: '#ffffff', stroke: '#ffffff' },
  [TeamColor.LIGHT_BLUE]: { name: 'Celeste', fill: '#5bb8e8', ink: '#131416', stroke: '#ffffff' },
  [TeamColor.WHITE]: { name: 'Blanco', fill: '#f4f5f4', ink: '#131416', stroke: '#131416' },
  [TeamColor.BLACK]: { name: 'Negro', fill: '#17191c', ink: '#ffffff', stroke: '#ffffff' },
  [TeamColor.PURPLE]: { name: 'Violeta', fill: '#7c4fc4', ink: '#ffffff', stroke: '#ffffff' },
  [TeamColor.PINK]: { name: 'Rosa', fill: '#e86aa6', ink: '#131416', stroke: '#ffffff' },
})

/** The goalkeeper always wears its own color, which no team can pick. */
export const GOALKEEPER_STYLE = Object.freeze({ fill: '#e2a50c', ink: '#131416', stroke: '#ffffff' })

/** Fill, number ink and outline of a player: its team's color, or the goalkeeper's own. */
export function playerColors(player, teamColors) {
  return player.role === Role.GOALKEEPER ? GOALKEEPER_STYLE : TEAM_COLOR_STYLES[teamColors[player.side]]
}
