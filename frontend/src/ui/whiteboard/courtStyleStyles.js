import { CourtStyle } from '../../domain/courtStyles.js'

/** How each court style is drawn: its Spanish name and the colors of the court, its surround, goal area and lines. */
export const COURT_STYLE_STYLES = Object.freeze({
  [CourtStyle.GREEN]: { name: 'Verde', court: '#2e7a52', offCourt: '#24613f', area: 'rgb(255 255 255 / 0.1)', line: '#ffffff' },
  [CourtStyle.BLUE]: { name: 'Azul', court: '#2f68a6', offCourt: '#c8692c', area: '#d27a3d', line: '#ffffff' },
  [CourtStyle.WOOD]: { name: 'Madera', court: '#c9965f', offCourt: '#9c6a3a', area: '#b8834e', line: '#1d2b4f' },
  [CourtStyle.CHALKBOARD]: { name: 'Pizarra', court: '#2b3330', offCourt: '#1f2523', area: '#343d39', line: '#e8ebe9' },
})

/** CSS custom properties that the court drawing reads, for the board's `style`. */
export function courtStyleVars(courtStyle) {
  const { court, offCourt, area, line } = COURT_STYLE_STYLES[courtStyle]
  return { '--color-court': court, '--color-off-court': offCourt, '--color-area': area, '--color-line': line }
}
