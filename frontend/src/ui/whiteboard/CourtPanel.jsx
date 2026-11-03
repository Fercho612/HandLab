import { COURT_STYLES } from '../../domain/courtStyles.js'
import { COURT_STYLE_STYLES } from './courtStyleStyles.js'
import styles from './Whiteboard.module.css'

/** Small drawing of a court style: the surround, the court and the goal area. */
function CourtSwatch({ look }) {
  return (
    <svg className={styles.courtSwatch} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill={look.offCourt} />
      <rect y="1" width="20" height="13" fill={look.court} />
      <path d="M4 1 A 6 6 0 0 0 16 1 Z" fill={look.area} stroke={look.line} strokeWidth="0.5" />
      <line x1="0" y1="1" x2="20" y2="1" stroke={look.line} strokeWidth="0.5" />
    </svg>
  )
}

export default function CourtPanel({ courtStyle, onCourtStyleChange }) {
  return (
    <section className={styles.panelSection} aria-labelledby="court-heading">
      <div className={styles.panelHeader}>
        <h2 id="court-heading" className={styles.panelTitle}>
          Cancha
        </h2>
      </div>

      <span id="court-style-label" className={styles.visuallyHidden}>
        Estilo de cancha
      </span>
      <div role="radiogroup" aria-labelledby="court-style-label" className={styles.courtStyles}>
        {COURT_STYLES.map((style) => {
          const look = COURT_STYLE_STYLES[style]
          return (
            <label key={style} className={styles.courtStyle}>
              <input
                type="radio"
                name="court-style"
                className={styles.visuallyHidden}
                checked={courtStyle === style}
                onChange={() => onCourtStyleChange(style)}
              />
              <CourtSwatch look={look} />
              <span>{look.name}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
