/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Whiteboard from './Whiteboard.jsx'

// jsdom has no SVG layout, so pointer coordinates are taken directly as court meters.
vi.mock('./toCourtPoint.js', () => ({
  toCourtPoint: (_svg, event) => ({ x: event.clientX, y: event.clientY }),
}))

const advance = (ms) => act(() => vi.advanceTimersByTime(ms))
const token = (name) => screen.getByLabelText(name)
const board = () => screen.getByRole('img', { name: 'Pizarra' })
const timeline = () => screen.getByRole('slider', { name: 'Línea de tiempo' })
const button = (name) => screen.getByRole('button', { name })

function drag(element, from, to) {
  fireEvent.pointerDown(element, { pointerId: 1, clientX: from.x, clientY: from.y })
  fireEvent.pointerMove(board(), { pointerId: 1, clientX: to.x, clientY: to.y })
  fireEvent.pointerUp(board(), { pointerId: 1, clientX: to.x, clientY: to.y })
  advance(16)
}

function seek(ms) {
  fireEvent.input(timeline(), { target: { value: String(ms) } })
  advance(16)
}

function renderBoard() {
  render(<Whiteboard />)
  advance(16)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Whiteboard', () => {
  it('places every player on the court and the ball in front of its holder', () => {
    renderBoard()

    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(1 1)')
    expect(token('Defensor 6')).toHaveAttribute('transform', 'translate(17 3.6)')
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(10 10)')
  })

  it('draws a square 20 x 20 m court with a small strip behind the goal line', () => {
    renderBoard()

    expect(board()).toHaveAttribute('viewBox', '0 -0.625 20 20.625')
  })

  it('starts with a single selected step numbered 0', () => {
    renderBoard()

    expect(button('Paso 0')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Paso 1' })).not.toBeInTheDocument()
    expect(timeline()).toHaveAttribute('max', '0')
  })

  it('adds a step after the current one and selects it', () => {
    renderBoard()

    fireEvent.click(button('Agregar paso'))
    advance(16)

    expect(button('Paso 1')).toHaveAttribute('aria-pressed', 'true')
    expect(button('Paso 0')).toHaveAttribute('aria-pressed', 'false')
    expect(timeline()).toHaveAttribute('max', '1000')
  })

  it('animates a player moved in a step from its previous position', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Atacante 1'), { x: 1, y: 1 }, { x: 5, y: 1 })

    seek(500)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(3 1)')
    seek(0)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(1 1)')
  })

  it('keeps the grab offset so the player does not jump under the pointer', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Atacante 1'), { x: 1.3, y: 1 }, { x: 5.3, y: 1 })

    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(5 1)')
  })

  it('keeps a player inside the court', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Atacante 1'), { x: 1, y: 1 }, { x: -4, y: 1 })

    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(0 1)')
  })

  it('edits the last step without asking', () => {
    vi.spyOn(window, 'confirm')
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Atacante 1'), { x: 1, y: 1 }, { x: 2, y: 2 })

    expect(window.confirm).not.toHaveBeenCalled()
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(2 2)')
  })

  it('deletes the following steps after confirming a change to an earlier step', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Paso 0'))
    advance(16)

    drag(token('Atacante 1'), { x: 1, y: 1 }, { x: 2, y: 2 })

    expect(window.confirm).toHaveBeenCalledWith(
      'Si modificas el Paso 0 se eliminarán los pasos siguientes (Paso 1 a Paso 2). ¿Continuar?',
    )
    expect(screen.queryByRole('button', { name: 'Paso 1' })).not.toBeInTheDocument()
    expect(timeline()).toHaveAttribute('max', '0')
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(2 2)')
  })

  it('keeps every step when a change to an earlier step is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Paso 0'))
    advance(16)

    drag(token('Pelota'), { x: 10, y: 10 }, { x: 16, y: 9.5 })

    expect(window.confirm).toHaveBeenCalledWith('Si modificas el Paso 0 se eliminará el paso siguiente (Paso 1). ¿Continuar?')
    expect(button('Paso 1')).toBeInTheDocument()
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(10 10)')
  })

  it('deletes the last step without asking and selects the previous one', () => {
    vi.spyOn(window, 'confirm')
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    fireEvent.click(button('Eliminar paso'))

    expect(window.confirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Paso 1' })).not.toBeInTheDocument()
    expect(button('Paso 0')).toHaveAttribute('aria-pressed', 'true')
  })

  it('deletes a step and the ones after it after confirming', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Paso 1'))

    fireEvent.click(button('Eliminar paso'))

    expect(window.confirm).toHaveBeenCalledWith(
      'Si eliminas el Paso 1 también se eliminarán los pasos siguientes (Paso 2 a Paso 3). ¿Continuar?',
    )
    expect(screen.queryByRole('button', { name: 'Paso 1' })).not.toBeInTheDocument()
    expect(button('Paso 0')).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the steps when deleting is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Paso 1'))

    fireEvent.click(button('Eliminar paso'))

    expect(button('Paso 2')).toBeInTheDocument()
  })

  it('cannot delete the starting step', () => {
    renderBoard()

    expect(button('Eliminar paso')).toBeDisabled()
  })

  it('passes the ball to a teammate during the transition', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Pelota'), { x: 10, y: 10 }, { x: 16, y: 9.5 })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(16 9)')
    seek(500)
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(13 9.5)')
  })

  it('holds the ball in front of a defender, facing away from the goal', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Pelota'), { x: 10, y: 10 }, { x: 8.5, y: 6.5 })

    expect(token('Pelota')).toHaveAttribute('transform', 'translate(8.5 7)')
  })

  it('shoots when the ball is released inside the goal', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Pelota'), { x: 10, y: 10 }, { x: 10, y: -0.25 })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(10 -0.25)')
  })

  it('discards a ball released away from every player and the goal', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    drag(token('Pelota'), { x: 10, y: 10 }, { x: 10, y: 18 })

    expect(screen.getByRole('alert')).toHaveTextContent('La pelota tiene que terminar en un jugador o en el arco.')
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(10 10)')
  })

  it('shows the goalkeeper in the goal when enabled', () => {
    renderBoard()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Habilitar arquero' }))
    advance(16)

    expect(token('Arquero')).toHaveAttribute('transform', 'translate(10 0.5)')
  })

  it('plays the steps and pauses at the end', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    drag(token('Atacante 1'), { x: 1, y: 1 }, { x: 5, y: 1 })
    fireEvent.click(button('Paso 0'))

    fireEvent.click(button('Reproducir'))
    advance(500)
    expect(button('Pausa')).toBeInTheDocument()

    advance(600)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(5 1)')
    expect(button('Reproducir')).toBeInTheDocument()
  })

  it('plays faster at 1.5x', () => {
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Agregar paso'))
    fireEvent.click(button('Paso 0'))

    fireEvent.change(screen.getByRole('combobox', { name: 'Velocidad' }), { target: { value: '1.5' } })
    fireEvent.click(button('Reproducir'))
    advance(1400)

    // 2 s of play take 1.33 s at 1.5x, so playback has ended; at 1x it would still be running.
    expect(button('Reproducir')).toBeInTheDocument()
  })

  it('erases every step after confirming a restart', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderBoard()
    fireEvent.click(button('Agregar paso'))
    drag(token('Atacante 1'), { x: 1, y: 1 }, { x: 3, y: 1 })

    fireEvent.click(button('Reiniciar'))
    advance(16)

    expect(window.confirm).toHaveBeenCalledWith('¿Reiniciar la pizarra? Se borrará todo lo grabado.')
    expect(screen.queryByRole('button', { name: 'Paso 1' })).not.toBeInTheDocument()
    expect(timeline()).toHaveAttribute('max', '0')
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(1 1)')
  })

  it('keeps the steps when the restart is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderBoard()
    fireEvent.click(button('Agregar paso'))

    fireEvent.click(button('Reiniciar'))

    expect(button('Paso 1')).toBeInTheDocument()
  })

  it('shows the save and delete buttons', () => {
    renderBoard()

    expect(button('Guardar')).toBeInTheDocument()
    expect(button('Eliminar')).toBeInTheDocument()
  })
})
