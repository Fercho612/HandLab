import styles from './Whiteboard.module.css'

/** Play-level actions. Saving and deleting have no behavior yet: they will call the backend once it exists. */
export default function PlayActions({ onRestart }) {
  return (
    <div className={styles.controls}>
      <button type="button" onClick={onRestart}>
        Reiniciar
      </button>
      <button type="button">Guardar</button>
      <button type="button">Eliminar</button>
    </div>
  )
}
