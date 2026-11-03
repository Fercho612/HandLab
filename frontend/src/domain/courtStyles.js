/** Looks the court can take. A style only changes how the court is drawn, never the play itself. */
export const CourtStyle = Object.freeze({
  GREEN: 'green',
  BLUE: 'blue',
  WOOD: 'wood',
  CHALKBOARD: 'chalkboard',
})

export const COURT_STYLES = Object.freeze(Object.values(CourtStyle))

export const DEFAULT_COURT_STYLE = CourtStyle.GREEN
