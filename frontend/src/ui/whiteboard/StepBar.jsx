import { stepTime } from '../../domain/play.js'
import controls from '../shared/controls.module.css'
import styles from './Whiteboard.module.css'

const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)} s`

export default function StepBar({ count, selected, onSelect, onAdd, onDelete }) {
  return (
    <section className={`${styles.panelSection} ${styles.stepsSection}`} aria-labelledby="steps-heading">
      <div className={styles.panelHeader}>
        <h2 id="steps-heading" className={styles.panelTitle}>
          Pasos
        </h2>
        <span className={styles.panelMeta}>{count === 1 ? '1 paso' : `${count} pasos`}</span>
      </div>

      <div className={styles.panelActions}>
        <button type="button" className={controls.button} onClick={onAdd}>
          <svg className={controls.icon} viewBox="0 0 14 14" aria-hidden="true">
            <path d="M6.25 1.5h1.5v4.75h4.75v1.5H7.75v4.75h-1.5V7.75H1.5v-1.5h4.75z" />
          </svg>
          Agregar paso
        </button>
        <button type="button" className={controls.button} onClick={onDelete} disabled={selected === 0}>
          Eliminar paso
        </button>
      </div>

      <ol className={styles.stepList}>
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className={styles.stepItem}>
            <button type="button" className={styles.step} aria-pressed={index === selected} onClick={() => onSelect(index)}>
              Paso {index}
            </button>
            <span className={styles.stepMeta}>{index === 0 ? 'Formación inicial' : formatSeconds(stepTime(index))}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
