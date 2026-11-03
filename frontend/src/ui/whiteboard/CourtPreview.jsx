import { ballPositionAt, createDefaultPlay } from '../../domain/play.js'
import { VIEW_BOX } from './boardView.js'
import CourtLines from './CourtLines.jsx'
import { courtStyleVars } from './courtStyleStyles.js'
import { playerLabels } from './playerLabels.js'
import { playerColors } from './teamColorStyles.js'
import { BallToken, PlayerToken } from './Tokens.jsx'
import styles from './Whiteboard.module.css'

const translate = ({ x, y }) => `translate(${x} ${y})`

/** Static picture of the default formation, drawn with the same court and tokens as the whiteboard. */
export default function CourtPreview({ className }) {
  const play = createDefaultPlay()
  const labels = playerLabels(play.players)
  const { positions } = play.steps[0]

  return (
    <svg
      className={`${styles.board} ${className ?? ''}`}
      style={courtStyleVars(play.courtStyle)}
      viewBox={VIEW_BOX}
      aria-hidden="true"
    >
      <CourtLines />
      {play.players.map((player) => (
        <g key={player.id} transform={translate(positions[player.id])}>
          <PlayerToken
            label={labels.get(player.id).label}
            position={labels.get(player.id).position}
            colors={playerColors(player, play.teamColors)}
          />
        </g>
      ))}
      <g transform={translate(ballPositionAt(play, 0))}>
        <BallToken />
      </g>
    </svg>
  )
}
