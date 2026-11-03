import controls from '../shared/controls.module.css'
import styles from './Whiteboard.module.css'

/** Play-level actions. Saving and deleting have no behavior yet: they will call the backend once it exists. */
export default function PlayActions({ onRestart }) {
  return (
    <div className={styles.playActions}>
      <button type="button" className={controls.button} onClick={onRestart}>
        Reiniciar
      </button>
      <button type="button" className={`${controls.button} ${controls.danger}`}>
        Eliminar
      </button>
      <button type="button" className={`${controls.button} ${controls.primary}`}>
        Guardar
      </button>
    </div>
  )
}
