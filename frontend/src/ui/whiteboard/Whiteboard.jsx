import { useLayoutEffect, useRef, useState } from 'react'
import { createPlaybackClock } from '../../application/playbackClock.js'
import { createTrajectoryRecorder } from '../../application/trajectoryRecorder.js'
import { ballHolderAt, ballPositionAt, recordBallAction, resolveBallRelease } from '../../domain/ball.js'
import { COURT, clampToCourt } from '../../domain/court.js'
import { createDefaultPlay, playDuration, recordPlayerLayer, resetPlay, setPlayGoalkeeper } from '../../domain/play.js'
import { Role, Side } from '../../domain/roster.js'
import { positionAt } from '../../domain/trajectory.js'
import CourtLines from './CourtLines.jsx'
import PlayActions from './PlayActions.jsx'
import PlaybackControls from './PlaybackControls.jsx'
import { BallToken, PlayerToken } from './Tokens.jsx'
import { toCourtPoint } from './toCourtPoint.js'
import { usePlaybackLoop } from './usePlaybackLoop.js'
import styles from './Whiteboard.module.css'

/** Space drawn behind the goal line, in meters: about 20px when the board is at its 640px maximum width. */
const GOAL_SIDE_MARGIN = 0.625
const VIEW_BOX = `0 ${-GOAL_SIDE_MARGIN} ${COURT.WIDTH} ${COURT.LENGTH + GOAL_SIDE_MARGIN}`
/**
 * A held ball is drawn in front of its holder, overlapping the marker a little.
 * Attackers face the goal (towards y = 0); defenders and the goalkeeper face the half-court line.
 */
const HELD_BALL_OFFSET = { [Side.ATTACK]: { x: 0, y: -0.5 }, [Side.DEFENSE]: { x: 0, y: 0.5 } }
const INVALID_RELEASE_MESSAGE = 'La pelota tiene que terminar en un jugador o en el arco.'
const RESTART_CONFIRMATION = '¿Reiniciar la pizarra? Se borrará todo lo grabado.'

/** Wall-clock time for the playback clock; only called from event handlers and the animation loop. */
const wallClock = () => performance.now()

const Recording = Object.freeze({ PLAYER: 'player', BALL: 'ball' })

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState(null)

  const [clock] = useState(() => createPlaybackClock({ duration: 0 }))
  const playRef = useRef(play)
  const recordingRef = useRef(null)
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
    const recording = recordingRef.current
    if (!recording && clock.isPlaying() && clock.hasEnded(now)) {
      clock.pause(now)
      setIsPlaying(false)
    }

    const t = clock.timeAt(now)
    const { players, ball } = playRef.current
    const isDragged = (kind, id) => recording?.kind === kind && recording.id === id
    const playerPosition = (player) =>
      isDragged(Recording.PLAYER, player.id) ? recording.point : positionAt(player.trajectory, t)

    for (const player of players) {
      const element = playerRefs.current.get(player.id)
      if (element) moveTo(element, playerPosition(player))
    }

    if (ballRef.current) moveTo(ballRef.current, currentBallPosition())
    if (timelineRef.current) timelineRef.current.value = String(t)
    if (timeLabelRef.current) timeLabelRef.current.textContent = `${(t / 1000).toFixed(1)} s`

    function currentBallPosition() {
      if (recording?.kind === Recording.BALL) return recording.point
      const holderId = ballHolderAt(ball, t)
      if (!holderId) return ballPositionAt(ball, players, t)
      const holder = players.find((player) => player.id === holderId)
      const position = playerPosition(holder)
      const offset = HELD_BALL_OFFSET[holder.side]
      return { x: position.x + offset.x, y: position.y + offset.y }
    }
  })

  function startRecording(kind, id, event) {
    const now = wallClock()
    const t = clock.timeAt(now)
    const { players, ball } = playRef.current

    const holderId = kind === Recording.BALL ? ballHolderAt(ball, t) : null
    // The ball can only be dragged away from the player holding it.
    if (kind === Recording.BALL && !holderId) return

    const grabbedId = kind === Recording.BALL ? holderId : id
    const start = positionAt(players.find((player) => player.id === grabbedId).trajectory, t)
    const recorder = createTrajectoryRecorder(kind === Recording.PLAYER ? { constrain: clampToCourt } : {})
    recorder.start(t, start)
    recordingRef.current = { kind, id, holderId, recorder, point: start }

    clock.setDuration(Infinity, now)
    clock.play(now)
    svgRef.current.setPointerCapture?.(event.pointerId)
    setMessage(null)
  }

  function handlePointerMove(event) {
    const recording = recordingRef.current
    if (!recording) return
    const point = toCourtPoint(svgRef.current, event)
    recording.recorder.sample(clock.timeAt(wallClock()), point)
    recording.point = recording.kind === Recording.PLAYER ? clampToCourt(point) : point
  }

  function handlePointerUp(event) {
    const recording = recordingRef.current
    if (!recording) return
    handlePointerMove(event)
    recordingRef.current = null

    const now = wallClock()
    const trajectory = recording.recorder.finish()
    let next = playRef.current

    // A tap without movement is not a recording: it must not erase what the element does afterwards.
    if (trajectory.length > 1) {
      if (recording.kind === Recording.PLAYER) {
        next = recordPlayerLayer(next, recording.id, trajectory)
      } else {
        const release = resolveBallRelease({
          players: next.players,
          holderId: recording.holderId,
          point: recording.point,
          t: clock.timeAt(now),
        })
        if (release) next = { ...next, ball: recordBallAction(next.ball, { ...release, trajectory }) }
        else setMessage(INVALID_RELEASE_MESSAGE)
      }
    }

    clock.pause(now)
    clock.setDuration(playDuration(next), now)
    playRef.current = next
    setPlay(next)
    setIsPlaying(false)
  }

  function togglePlay() {
    const now = wallClock()
    if (isPlaying) clock.pause(now)
    else clock.play(now)
    setIsPlaying(!isPlaying)
  }

  function restart() {
    if (!window.confirm(RESTART_CONFIRMATION)) return
    const next = resetPlay(play)
    const now = wallClock()
    clock.pause(now)
    clock.setDuration(0, now)
    playRef.current = next
    setPlay(next)
    setIsPlaying(false)
    setMessage(null)
  }

  function changeGoalkeeper(enabled) {
    const next = setPlayGoalkeeper(play, enabled)
    clock.setDuration(playDuration(next), wallClock())
    setPlay(next)
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
            onPointerDown={(event) => startRecording(Recording.PLAYER, player.id, event)}
          />
        ))}
        <BallToken elementRef={ballRef} onPointerDown={(event) => startRecording(Recording.BALL, null, event)} />
      </svg>

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
        goalkeeperEnabled={play.players.some((player) => player.role === Role.GOALKEEPER)}
        onTogglePlay={togglePlay}
        onSeek={(t) => clock.seek(t, wallClock())}
        onRateChange={(rate) => clock.setRate(rate, wallClock())}
        onGoalkeeperChange={changeGoalkeeper}
      />

      <PlayActions onRestart={restart} />
    </div>
  )
}
