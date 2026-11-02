import { COURT, GOAL } from '../../domain/court.js'
import styles from './Whiteboard.module.css'

const LEFT_POST = GOAL.CENTER_X - GOAL.WIDTH / 2
const RIGHT_POST = GOAL.CENTER_X + GOAL.WIDTH / 2

/** Goal-area style line: two quarter circles around the posts joined by a straight segment. */
function areaPath(radius) {
  return [
    `M ${LEFT_POST - radius} 0`,
    `A ${radius} ${radius} 0 0 0 ${LEFT_POST} ${radius}`,
    `L ${RIGHT_POST} ${radius}`,
    `A ${radius} ${radius} 0 0 0 ${RIGHT_POST + radius} 0`,
  ].join(' ')
}

export default function CourtLines() {
  return (
    <g aria-hidden="true">
      <defs>
        <clipPath id="court-clip">
          <rect x="0" y="0" width={COURT.WIDTH} height={COURT.LENGTH} />
        </clipPath>
      </defs>
      <rect className={styles.line} x="0" y="0" width={COURT.WIDTH} height={COURT.LENGTH} />
      <rect className={styles.goal} x={LEFT_POST} y={-GOAL.DEPTH} width={GOAL.WIDTH} height={GOAL.DEPTH} />
      <path className={styles.area} d={areaPath(6)} />
      <path className={`${styles.line} ${styles.dashed}`} d={areaPath(9)} clipPath="url(#court-clip)" />
      <line className={styles.line} x1={GOAL.CENTER_X - 0.5} y1="7" x2={GOAL.CENTER_X + 0.5} y2="7" />
      <line className={styles.line} x1={GOAL.CENTER_X - 0.075} y1="4" x2={GOAL.CENTER_X + 0.075} y2="4" />
    </g>
  )
}
