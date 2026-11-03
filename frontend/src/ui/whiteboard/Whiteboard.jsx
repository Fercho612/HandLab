import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPlaybackClock } from '../../application/playbackClock.js'
import { BallActionType, heldBallPosition, resolveBallRelease } from '../../domain/ball.js'
import {
  addStep,
  ballPositionAt,
  createDefaultPlay,
  deleteStep,
  followingSteps,
  moveBall,
  movePlayer,
  nearestStep,
  playDuration,
  playerPositionAt,
  resetPlay,
  setCourtStyle,
  setFieldPlayerCount,
  setPlayGoalkeeper,
  setPlayerPosition,
  setTeamColor,
  stepTime,
} from '../../domain/play.js'
import { Role } from '../../domain/roster.js'
import { VIEW_BOX, clampToVisibleCourt } from './boardView.js'
import CourtLines from './CourtLines.jsx'
import CourtPanel from './CourtPanel.jsx'
import { courtStyleVars } from './courtStyleStyles.js'
import PlayActions from './PlayActions.jsx'
import PlaybackControls from './PlaybackControls.jsx'
import PositionMenu from './PositionMenu.jsx'
import RosterPanel from './RosterPanel.jsx'
import StepBar from './StepBar.jsx'
import { playerLabels } from './playerLabels.js'
import { playerColors } from './teamColorStyles.js'
import { BallToken, PlayerToken } from './Tokens.jsx'
import { toCourtPoint } from './toCourtPoint.js'
import { usePlaybackLoop } from './usePlaybackLoop.js'
import controls from '../shared/controls.module.css'
import styles from './Whiteboard.module.css'

/** A drag shorter than this, in meters, is a tap and changes nothing. */
const MIN_DRAG_DISTANCE = 0.05
const INVALID_RELEASE_MESSAGE = 'La pelota tiene que terminar en un jugador o en el arco.'
const RESTART_CONFIRMATION = '¿Reiniciar la pizarra? Se borrará todo lo grabado.'

/** Describes the steps after `step` that an edit or a deletion removes, for the confirmation messages. */
function followingStepsWarning(action, step, count) {
  const steps = count === 1 ? `el paso siguiente (Paso ${step + 1})` : `los pasos siguientes (Paso ${step + 1} a Paso ${step + count})`
  const verb = count === 1 ? 'se eliminará' : 'se eliminarán'
  return action === 'modify'
    ? `Si modificas el Paso ${step} ${verb} ${steps}. ¿Continuar?`
    : `Si eliminas el Paso ${step} también ${verb} ${steps}. ¿Continuar?`
}

/** Modifying or deleting a step removes the ones after it, so the user confirms first when there are any. */
function confirmFollowingSteps(action, play, step) {
  const count = followingSteps(play, step)
  return count === 0 || window.confirm(followingStepsWarning(action, step, count))
}

/** Size of the position menu, in pixels, to keep it inside the board. */
const POSITION_MENU_WIDTH = 280
const POSITION_MENU_HEIGHT = 200

/** Wall-clock time for the playback clock; only called from event handlers and the animation loop. */
const wallClock = () => performance.now()

const Dragging = Object.freeze({ PLAYER: 'player', BALL: 'ball' })

const round = (value) => Math.round(value * 1000) / 1000
const moveTo = (element, { x, y }) => element.setAttribute('transform', `translate(${round(x)} ${round(y)})`)

export default function Whiteboard() {
  const [play, setPlay] = useState(createDefaultPlay)
  const [selectedStep, setSelectedStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState(null)
  const [positionMenu, setPositionMenu] = useState(null)
  const closePositionMenu = useCallback(() => setPositionMenu(null), [])

  const [clock] = useState(() => createPlaybackClock({ duration: 0 }))
  const playRef = useRef(play)
  const dragRef = useRef(null)
  const svgRef = useRef(null)
  const playerRefs = useRef(new Map())
  const ballRef = useRef(null)
  const timelineRef = useRef(null)
  const timeLabelRef = useRef(null)
  const boardColumnRef = useRef(null)

  useLayoutEffect(() => {
    playRef.current = play
  }, [play])

  usePlaybackLoop(() => {
    const now = wallClock()
    if (clock.isPlaying() && clock.hasEnded(now)) {
      clock.pause(now)
      setIsPlaying(false)
      setSelectedStep(nearestStep(playRef.current, clock.timeAt(now)))
    }

    const t = clock.timeAt(now)
    const current = playRef.current
    const drag = dragRef.current
    const draggedPlayer = drag?.kind === Dragging.PLAYER ? drag.id : null
    const positionOf = (id) => (id === draggedPlayer ? drag.point : playerPositionAt(current, id, t))

    for (const player of current.players) {
      const element = playerRefs.current.get(player.id)
      if (element) moveTo(element, positionOf(player.id))
    }

    if (ballRef.current) moveTo(ballRef.current, currentBallPosition())
    if (timelineRef.current) timelineRef.current.value = String(t)
    if (timeLabelRef.current) timeLabelRef.current.textContent = `${(t / 1000).toFixed(1)} s`

    function currentBallPosition() {
      if (drag?.kind === Dragging.BALL) return drag.point
      // While its holder is dragged, the ball moves with them.
      const holderId = drag && current.steps[drag.step].ball.holderId
      if (draggedPlayer && holderId === draggedPlayer) {
        const holder = current.players.find((player) => player.id === holderId)
        return heldBallPosition(holder, drag.point)
      }
      return ballPositionAt(current, t)
    }
  })

  function goToStep(index, current = play) {
    const now = wallClock()
    clock.pause(now)
    clock.setDuration(playDuration(current), now)
    clock.seek(stepTime(index), now)
    setIsPlaying(false)
    setSelectedStep(index)
  }

  function commit(next, step) {
    playRef.current = next
    setPlay(next)
    goToStep(step, next)
  }

  function startDrag(kind, id, event) {
    // Editing always happens on a step: pause and snap to the nearest one.
    const step = nearestStep(play, clock.timeAt(wallClock()))
    goToStep(step)

    const { positions, ball } = play.steps[step]
    let start
    if (kind === Dragging.PLAYER) {
      start = positions[id]
    } else {
      // A ball that is already in the goal cannot be moved.
      if (!ball.holderId) return
      const holder = play.players.find((player) => player.id === ball.holderId)
      start = heldBallPosition(holder, positions[holder.id])
    }

    const pointer = toCourtPoint(svgRef.current, event)
    dragRef.current = {
      kind,
      id,
      step,
      start,
      point: start,
      offset: { x: start.x - pointer.x, y: start.y - pointer.y },
    }
    svgRef.current.setPointerCapture?.(event.pointerId)
    setMessage(null)
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const pointer = toCourtPoint(svgRef.current, event)
    const point = { x: pointer.x + drag.offset.x, y: pointer.y + drag.offset.y }
    drag.point = drag.kind === Dragging.PLAYER ? clampToVisibleCourt(point) : point
  }

  function handlePointerUp(event) {
    const drag = dragRef.current
    if (!drag) return
    handlePointerMove(event)
    dragRef.current = null

    const moved = Math.hypot(drag.point.x - drag.start.x, drag.point.y - drag.start.y)
    if (moved < MIN_DRAG_DISTANCE) {
      // A tap on a field player opens its position menu; the goalkeeper's position never changes.
      if (drag.kind === Dragging.PLAYER) openPositionMenu(drag.id)
      return
    }

    if (drag.kind === Dragging.PLAYER) {
      if (!confirmFollowingSteps('modify', play, drag.step)) return
      commit(movePlayer(play, drag.step, drag.id, drag.point), drag.step)
      return
    }

    const { positions, ball } = play.steps[drag.step]
    const release = resolveBallRelease({ players: play.players, positions, holderId: ball.holderId, point: drag.point })
    if (!release) {
      setMessage(INVALID_RELEASE_MESSAGE)
      return
    }
    if (!confirmFollowingSteps('modify', play, drag.step)) return
    const nextBall = release.type === BallActionType.SHOT ? { goal: drag.point } : { holderId: release.toPlayerId }
    commit(moveBall(play, drag.step, nextBall), drag.step)
  }

  function openPositionMenu(playerId) {
    const player = play.players.find((candidate) => candidate.id === playerId)
    if (player.role !== Role.FIELD) return
    setPositionMenu({ playerId, anchor: positionMenuAnchor(playerId) })
  }

  /** Places the menu under the tapped player, or above it near the bottom, always inside the board. */
  function positionMenuAnchor(playerId) {
    const column = boardColumnRef.current.getBoundingClientRect()
    const token = playerRefs.current.get(playerId).getBoundingClientRect()
    const center = token.left + token.width / 2 - column.left
    const below = token.bottom - column.top + 8
    const fitsBelow = below + POSITION_MENU_HEIGHT <= column.height
    const half = POSITION_MENU_WIDTH / 2
    return {
      left: Math.min(Math.max(center, half), column.width - half),
      top: fitsBelow ? below : token.top - column.top - 8,
      placement: fitsBelow ? 'below' : 'above',
    }
  }

  function choosePosition(position) {
    commit(setPlayerPosition(play, positionMenu.playerId, position), selectedStep)
    setPositionMenu(null)
  }

  function togglePlay() {
    const now = wallClock()
    if (isPlaying) {
      clock.pause(now)
      setSelectedStep(nearestStep(play, clock.timeAt(now)))
    } else {
      clock.play(now)
    }
    setIsPlaying(!isPlaying)
  }

  function addStepAtEnd() {
    commit(addStep(play), play.steps.length)
  }

  function deleteSelectedStep() {
    if (!confirmFollowingSteps('delete', play, selectedStep)) return
    commit(deleteStep(play, selectedStep), selectedStep - 1)
  }

  function restart() {
    if (!window.confirm(RESTART_CONFIRMATION)) return
    setMessage(null)
    commit(resetPlay(play), 0)
  }

  const labels = playerLabels(play.players)
  const bindPlayerRef = (id) => (element) => {
    if (element) playerRefs.current.set(id, element)
    else playerRefs.current.delete(id)
  }

  return (
    <div className={styles.editor}>
      <div className={styles.titleRow}>
        <div className={styles.titleBlock}>
          <div className={styles.titleLine}>
            <h1 className={styles.title}>Nueva jugada</h1>
            <span className={controls.pill}>Sin guardar</span>
          </div>
          <p className={styles.subtitle}>Agrega pasos y mueve a los jugadores o la pelota en cada uno.</p>
        </div>
        <PlayActions onRestart={restart} />
      </div>

      <div className={styles.workspace}>
        <section className={styles.canvas} aria-label="Cancha">
          <div ref={boardColumnRef} className={styles.boardColumn}>
            <svg
              ref={svgRef}
              className={styles.board}
              style={courtStyleVars(play.courtStyle)}
              viewBox={VIEW_BOX}
              role="img"
              aria-label="Pizarra"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <CourtLines />
              {play.players.map((player) => (
                <PlayerToken
                  key={player.id}
                  label={labels.get(player.id).label}
                  position={labels.get(player.id).position}
                  colors={playerColors(player, play.teamColors)}
                  elementRef={bindPlayerRef(player.id)}
                  onPointerDown={(event) => startDrag(Dragging.PLAYER, player.id, event)}
                />
              ))}
              <BallToken elementRef={ballRef} onPointerDown={(event) => startDrag(Dragging.BALL, null, event)} />
            </svg>

            {positionMenu && (
              <PositionMenu
                player={play.players.find((player) => player.id === positionMenu.playerId)}
                label={labels.get(positionMenu.playerId).label}
                anchor={positionMenu.anchor}
                onSelect={choosePosition}
                onClose={closePositionMenu}
              />
            )}

            {message && (
              <p role="alert" className={styles.message}>
                {message}
              </p>
            )}

            <PlaybackControls
              isPlaying={isPlaying}
              duration={playDuration(play)}
              timelineRef={timelineRef}
              timeLabelRef={timeLabelRef}
              onTogglePlay={togglePlay}
              onSeek={(t) => clock.seek(t, wallClock())}
              onRateChange={(rate) => clock.setRate(rate, wallClock())}
            />
          </div>
        </section>

        <aside className={styles.panel}>
          <StepBar
            count={play.steps.length}
            selected={selectedStep}
            onSelect={(index) => goToStep(index)}
            onAdd={addStepAtEnd}
            onDelete={deleteSelectedStep}
          />
          <RosterPanel
            players={play.players}
            teamColors={play.teamColors}
            onFieldCountChange={(side, count) => commit(setFieldPlayerCount(play, side, count), selectedStep)}
            onTeamColorChange={(side, color) => commit(setTeamColor(play, side, color), selectedStep)}
            onGoalkeeperChange={(enabled) => commit(setPlayGoalkeeper(play, enabled), selectedStep)}
          />
          <CourtPanel
            courtStyle={play.courtStyle}
            onCourtStyleChange={(courtStyle) => commit(setCourtStyle(play, courtStyle), selectedStep)}
          />
        </aside>
      </div>
    </div>
  )
}
