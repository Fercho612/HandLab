import { useLayoutEffect, useRef, useState } from 'react'
import { createPlaybackClock } from '../../application/playbackClock.js'
import { BallActionType, heldBallPosition, resolveBallRelease } from '../../domain/ball.js'
import { COURT, clampToCourt } from '../../domain/court.js'
import {
  addStep,
  ballPositionAt,
  createDefaultPlay,
  moveBall,
  movePlayer,
  nearestStep,
  playDuration,
  playerPositionAt,
  resetPlay,
  setPlayGoalkeeper,
  stepTime,
} from '../../domain/play.js'
import { Role, Side } from '../../domain/roster.js'
import CourtLines from './CourtLines.jsx'
import PlayActions from './PlayActions.jsx'
import PlaybackControls from './PlaybackControls.jsx'
import StepBar from './StepBar.jsx'
import { BallToken, PlayerToken } from './Tokens.jsx'
import { toCourtPoint } from './toCourtPoint.js'
import { usePlaybackLoop } from './usePlaybackLoop.js'
import styles from './Whiteboard.module.css'

/** Space drawn behind the goal line, in meters: about 20px when the board is at its 640px maximum width. */
const GOAL_SIDE_MARGIN = 0.625
const VIEW_BOX = `0 ${-GOAL_SIDE_MARGIN} ${COURT.WIDTH} ${COURT.LENGTH + GOAL_SIDE_MARGIN}`
/** A drag shorter than this, in meters, is a tap and changes nothing. */
const MIN_DRAG_DISTANCE = 0.05
const INVALID_RELEASE_MESSAGE = 'La pelota tiene que terminar en un jugador o en el arco.'
const RESTART_CONFIRMATION = '¿Reiniciar la pizarra? Se borrará todo lo grabado.'

/** Wall-clock time for the playback clock; only called from event handlers and the animation loop. */
const wallClock = () => performance.now()

const Dragging = Object.freeze({ PLAYER: 'player', BALL: 'ball' })

const round = (value) => Math.round(value * 1000) / 1000
const moveTo = (element, { x, y }) => element.setAttribute('transform', `translate(${round(x)} ${round(y)})`)

function playerLabels(players) {
  const counters = { [Side.ATTACK]: 0, [Side.DEFENSE]: 0 }
  return new Map(
    players.map((player) => {
      if (player.role === Role.GOALKEEPER) return [player.id, { label: 'Arquero', number: 'AR' }]
      const number = ++counters[player.side]
      const name = player.side === Side.ATTACK ? 'Atacante' : 'Defensor'
      return [player.id, { label: `${name} ${number}`, number }]
    }),
  )
}

export default function Whiteboard() {
  const [play, setPlay] = useState(createDefaultPlay)
  const [selectedStep, setSelectedStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState(null)

  const [clock] = useState(() => createPlaybackClock({ duration: 0 }))
  const playRef = useRef(play)
  const dragRef = useRef(null)
  const svgRef = useRef(null)
  const playerRefs = useRef(new Map())
  const ballRef = useRef(null)
  const timelineRef = useRef(null)
  const timeLabelRef = useRef(null)

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
    drag.point = drag.kind === Dragging.PLAYER ? clampToCourt(point) : point
  }

  function handlePointerUp(event) {
    const drag = dragRef.current
    if (!drag) return
    handlePointerMove(event)
    dragRef.current = null

    const moved = Math.hypot(drag.point.x - drag.start.x, drag.point.y - drag.start.y)
    if (moved < MIN_DRAG_DISTANCE) return

    if (drag.kind === Dragging.PLAYER) {
      commit(movePlayer(play, drag.step, drag.id, drag.point), drag.step)
      return
    }

    const { positions, ball } = play.steps[drag.step]
    const release = resolveBallRelease({ players: play.players, positions, holderId: ball.holderId, point: drag.point })
    if (!release) {
      setMessage(INVALID_RELEASE_MESSAGE)
      return
    }
    const nextBall = release.type === BallActionType.SHOT ? { goal: drag.point } : { holderId: release.toPlayerId }
    commit(moveBall(play, drag.step, nextBall), drag.step)
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

  function addStepAfterSelected() {
    commit(addStep(play, selectedStep), selectedStep + 1)
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
    <div className={styles.wrapper}>
      <svg
        ref={svgRef}
        className={styles.board}
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
            player={player}
            label={labels.get(player.id).label}
            number={labels.get(player.id).number}
            elementRef={bindPlayerRef(player.id)}
            onPointerDown={(event) => startDrag(Dragging.PLAYER, player.id, event)}
          />
        ))}
        <BallToken elementRef={ballRef} onPointerDown={(event) => startDrag(Dragging.BALL, null, event)} />
      </svg>

      {message && (
        <p role="alert" className={styles.message}>
          {message}
        </p>
      )}

      <StepBar
        count={play.steps.length}
        selected={selectedStep}
        onSelect={(index) => goToStep(index)}
        onAdd={addStepAfterSelected}
      />

      <PlaybackControls
        isPlaying={isPlaying}
        duration={playDuration(play)}
        timelineRef={timelineRef}
        timeLabelRef={timeLabelRef}
        goalkeeperEnabled={play.players.some((player) => player.role === Role.GOALKEEPER)}
        onTogglePlay={togglePlay}
        onSeek={(t) => clock.seek(t, wallClock())}
        onRateChange={(rate) => clock.setRate(rate, wallClock())}
        onGoalkeeperChange={(enabled) => commit(setPlayGoalkeeper(play, enabled), selectedStep)}
      />

      <PlayActions onRestart={restart} />
    </div>
  )
}
