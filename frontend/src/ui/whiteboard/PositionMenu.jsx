import { useEffect, useRef } from 'react'
import { POSITIONS_BY_SIDE } from '../../domain/positions.js'
import { POSITION_NAMES } from './positionNames.js'
import styles from './Whiteboard.module.css'

const NEXT_KEYS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }

/** Menu, anchored next to a player, to choose the position that player plays. */
export default function PositionMenu({ player, label, anchor, onSelect, onClose }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const menu = menuRef.current
    menu.querySelector('[aria-checked="true"]')?.focus()

    const closeOnOutsidePointer = (event) => {
      if (!menu.contains(event.target)) onClose()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [onClose])

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    const step = NEXT_KEYS[event.key]
    if (!step) return
    event.preventDefault()
    const items = [...menuRef.current.querySelectorAll('[role="menuitemradio"]')]
    const next = (items.indexOf(document.activeElement) + step + items.length) % items.length
    items[next].focus()
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Posición de ${label}`}
      className={styles.positionMenu}
      data-placement={anchor.placement}
      style={{ left: anchor.left, top: anchor.top }}
      onKeyDown={handleKeyDown}
    >
      <p className={styles.positionMenuTitle} aria-hidden="true">
        {label}
      </p>
      <div className={styles.positionOptions}>
        {POSITIONS_BY_SIDE[player.side].map((position) => (
          <button
            key={position}
            type="button"
            role="menuitemradio"
            aria-checked={player.position === position}
            tabIndex={player.position === position ? 0 : -1}
            className={styles.positionOption}
            onClick={() => onSelect(position)}
          >
            <span className={styles.positionCode}>{position}</span>{' '}
            <span className={styles.positionName}>{POSITION_NAMES[position]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
