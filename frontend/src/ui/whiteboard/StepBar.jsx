import styles from './Whiteboard.module.css'

export default function StepBar({ count, selected, onSelect, onAdd, onDelete }) {
  return (
    <div className={styles.controls}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className={styles.step}
          aria-pressed={index === selected}
          onClick={() => onSelect(index)}
        >
          Paso {index}
        </button>
      ))}
      <button type="button" onClick={onAdd}>
        Agregar paso
      </button>
      <button type="button" onClick={onDelete} disabled={selected === 0}>
        Eliminar paso
      </button>
    </div>
  )
}
