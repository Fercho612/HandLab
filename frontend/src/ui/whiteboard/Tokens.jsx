import styles from './Whiteboard.module.css'

export const PLAYER_RADIUS = 0.45
const BALL_RADIUS = 0.22

/** Player marker. Its position is written by the playback loop through `elementRef`, never by props. */
export function PlayerToken({ label, position, colors, elementRef, onPointerDown }) {
  return (
    <g ref={elementRef} aria-label={label} className={styles.token} onPointerDown={onPointerDown}>
      <circle r={PLAYER_RADIUS} fill={colors.fill} stroke={colors.stroke} />
      <text y="0.18" textAnchor="middle" fill={colors.ink}>
        {position}
      </text>
    </g>
  )
}

export function BallToken({ elementRef, onPointerDown }) {
  return (
    <g ref={elementRef} aria-label="Pelota" className={`${styles.token} ${styles.ball}`} onPointerDown={onPointerDown}>
      <circle r={BALL_RADIUS} />
    </g>
  )
}
