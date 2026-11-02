import styles from './Whiteboard.module.css'

export default function StepBar({ count, selected, onSelect, onAdd }) {
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
          Paso {index + 1}
        </button>
      ))}
      <button type="button" onClick={onAdd}>
        Agregar paso
      </button>
    </div>
  )
}
