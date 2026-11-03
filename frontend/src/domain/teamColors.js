import { Side } from './roster.js'

/**
 * Colors a team can wear. The goalkeeper keeps its own color, so none of these is close to it,
 * and none is green so players stay visible on the court.
 */
export const TeamColor = Object.freeze({
  RED: 'red',
  BLUE: 'blue',
  LIGHT_BLUE: 'light-blue',
  WHITE: 'white',
  BLACK: 'black',
  PURPLE: 'purple',
  PINK: 'pink',
})

export const TEAM_COLORS = Object.freeze(Object.values(TeamColor))

export const DEFAULT_TEAM_COLORS = Object.freeze({ [Side.ATTACK]: TeamColor.RED, [Side.DEFENSE]: TeamColor.BLUE })

export const otherSide = (side) => (side === Side.ATTACK ? Side.DEFENSE : Side.ATTACK)

/** A color is available to a team when it is in the palette and the other team is not wearing it. */
export function isTeamColorAvailable(teamColors, side, color) {
  return TEAM_COLORS.includes(color) && teamColors[otherSide(side)] !== color
}
