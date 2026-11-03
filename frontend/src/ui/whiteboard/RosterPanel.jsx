import { FIELD_PLAYER_LIMITS } from '../../domain/play.js'
import { Role, Side } from '../../domain/roster.js'
import { TEAM_COLORS, isTeamColorAvailable } from '../../domain/teamColors.js'
import { GOALKEEPER_STYLE, TEAM_COLOR_STYLES } from './teamColorStyles.js'
import styles from './Whiteboard.module.css'

const TEAMS = [
  { side: Side.ATTACK, title: 'Atacantes', singular: 'atacante', colorLabel: 'Color de los atacantes' },
  { side: Side.DEFENSE, title: 'Defensores', singular: 'defensor', colorLabel: 'Color de los defensores' },
]

function TeamRow({ team, count, teamColors, onCountChange, onColorChange }) {
  const { side, title, singular, colorLabel } = team
  const { min, max } = FIELD_PLAYER_LIMITS[side]
  const labelId = `${side}-color-label`

  return (
    <div className={styles.team}>
      <div className={styles.teamHeader}>
        <span className={styles.teamName}>
          <span className={styles.swatch} style={{ background: TEAM_COLOR_STYLES[teamColors[side]].fill }} aria-hidden="true" />
          {title}
        </span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={`Quitar ${singular}`}
            disabled={count <= min}
            onClick={() => onCountChange(side, count - 1)}
          >
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 6.25h10v1.5H2z" />
            </svg>
          </button>
          <output className={styles.stepperValue} aria-live="polite">
            {count}
          </output>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={`Agregar ${singular}`}
            disabled={count >= max}
            onClick={() => onCountChange(side, count + 1)}
          >
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M6.25 2h1.5v4.25H12v1.5H7.75V12h-1.5V7.75H2v-1.5h4.25z" />
            </svg>
          </button>
        </div>
      </div>

      <span id={labelId} className={styles.visuallyHidden}>
        {colorLabel}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.colorPicker}>
        {TEAM_COLORS.map((color) => {
          const { name, fill } = TEAM_COLOR_STYLES[color]
          const available = isTeamColorAvailable(teamColors, side, color)
          return (
            <input
              key={color}
              type="radio"
              name={`${side}-color`}
              className={styles.colorOption}
              style={{ '--option-color': fill }}
              aria-label={name}
              title={available ? name : `${name}: lo usa el otro equipo`}
              checked={teamColors[side] === color}
              disabled={!available}
              onChange={() => onColorChange(side, color)}
            />
          )
        })}
      </div>
    </div>
  )
}

/** Who is on the court: field players and color per team, and the optional goalkeeper. */
export default function RosterPanel({ players, teamColors, onFieldCountChange, onTeamColorChange, onGoalkeeperChange }) {
  const fieldPlayers = (side) => players.filter((player) => player.side === side && player.role === Role.FIELD).length
  const goalkeeperEnabled = players.some((player) => player.role === Role.GOALKEEPER)

  return (
    <section className={styles.panelSection} aria-labelledby="roster-heading">
      <div className={styles.panelHeader}>
        <h2 id="roster-heading" className={styles.panelTitle}>
          Jugadores
        </h2>
        <span className={styles.panelMeta}>{players.length} en cancha</span>
      </div>

      {TEAMS.map((team) => (
        <TeamRow
          key={team.side}
          team={team}
          count={fieldPlayers(team.side)}
          teamColors={teamColors}
          onCountChange={onFieldCountChange}
          onColorChange={onTeamColorChange}
        />
      ))}

      <label className={styles.toggle}>
        <input type="checkbox" checked={goalkeeperEnabled} onChange={(event) => onGoalkeeperChange(event.target.checked)} />
        <span className={styles.swatch} style={{ background: GOALKEEPER_STYLE.fill }} aria-hidden="true" />
        Habilitar arquero
      </label>
    </section>
  )
}
