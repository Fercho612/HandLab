import { Role } from '../../domain/roster.js'
import styles from './Whiteboard.module.css'

export const PLAYER_RADIUS = 0.45
const BALL_RADIUS = 0.22

/** Player marker. Its position is written by the playback loop through `elementRef`, never by props. */
export function PlayerToken({ player, label, number, elementRef, onPointerDown }) {
  const roleClass = player.role === Role.GOALKEEPER ? styles.goalkeeper : styles[player.side]
  return (
    <g ref={elementRef} aria-label={label} className={`${styles.token} ${roleClass}`} onPointerDown={onPointerDown}>
      <circle r={PLAYER_RADIUS} />
      <text y="0.18" textAnchor="middle">
        {number}
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
