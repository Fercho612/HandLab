import styles from './Whiteboard.module.css'

const SPEEDS = [0.5, 1, 2]

export default function PlaybackControls({
  isPlaying,
  duration,
  timelineRef,
  timeLabelRef,
  goalkeeperEnabled,
  onTogglePlay,
  onSeek,
  onRateChange,
  onGoalkeeperChange,
}) {
  return (
    <div className={styles.controls}>
      <button type="button" onClick={onTogglePlay}>
        {isPlaying ? 'Pausa' : 'Reproducir'}
      </button>
      <input
        ref={timelineRef}
        className={styles.timeline}
        type="range"
        aria-label="Línea de tiempo"
        min="0"
        max={duration}
        step="10"
        defaultValue="0"
        onChange={(event) => onSeek(Number(event.target.value))}
      />
      <span ref={timeLabelRef} className={styles.time}>
        0.0 s
      </span>
      <label>
        Velocidad{' '}
        <select defaultValue="1" onChange={(event) => onRateChange(Number(event.target.value))}>
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={goalkeeperEnabled} onChange={(event) => onGoalkeeperChange(event.target.checked)} />{' '}
        Habilitar arquero
      </label>
    </div>
  )
}
