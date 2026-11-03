import controls from '../shared/controls.module.css'
import styles from './Whiteboard.module.css'

const SPEEDS = [0.5, 1, 1.5, 2]

export default function PlaybackControls({ isPlaying, duration, timelineRef, timeLabelRef, onTogglePlay, onSeek, onRateChange }) {
  return (
    <div className={styles.transport}>
      <button type="button" className={`${controls.button} ${styles.playButton}`} onClick={onTogglePlay}>
        <svg className={controls.icon} viewBox="0 0 14 14" aria-hidden="true">
          {isPlaying ? <path d="M3 2h3v10H3zM8 2h3v10H8z" /> : <path d="M3.5 1.75v10.5L12 7z" />}
        </svg>
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
      <label className={styles.speed}>
        <span>Velocidad</span>
        <select className={styles.select} defaultValue="1" onChange={(event) => onRateChange(Number(event.target.value))}>
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
