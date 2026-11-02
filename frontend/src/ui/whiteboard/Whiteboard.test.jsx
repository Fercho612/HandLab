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

function drag(element, path, stepMs) {
  const [start, ...rest] = path
  fireEvent.pointerDown(element, { pointerId: 1, clientX: start.x, clientY: start.y })
  for (const point of rest) {
    advance(stepMs)
    fireEvent.pointerMove(board(), { pointerId: 1, clientX: point.x, clientY: point.y })
  }
  const end = rest[rest.length - 1] ?? start
  fireEvent.pointerUp(board(), { pointerId: 1, clientX: end.x, clientY: end.y })
}

function seek(ms) {
  fireEvent.input(timeline(), { target: { value: String(ms) } })
  advance(16)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Whiteboard', () => {
  it('places every player on the court and the ball in front of its holder', () => {
    render(<Whiteboard />)
    advance(16)

    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(1 1)')
    expect(token('Defensor 6')).toHaveAttribute('transform', 'translate(17 3.6)')
    // Attackers face the goal, so the ball sits between them and the goal, overlapping the marker.
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(10 10)')
  })

  it('places the ball in front of a defender, facing away from the goal', () => {
    render(<Whiteboard />)
    advance(16)
    drag(token('Pelota'), [{ x: 10, y: 10.5 }, { x: 8.5, y: 6.5 }], 400)
    drag(token('Atacante 1'), [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }], 500)

    seek(1000)
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(8.5 7)')
  })

  it('draws a square 20 x 20 m court with a small strip behind the goal line', () => {
    render(<Whiteboard />)

    expect(board()).toHaveAttribute('viewBox', '0 -0.625 20 20.625')
  })

  it('records a dragged player as a new layer of the play', () => {
    render(<Whiteboard />)
    advance(16)

    drag(token('Atacante 1'), [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }], 500)

    expect(timeline()).toHaveAttribute('max', '1000')
    seek(500)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(3 1)')
    seek(1000)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(5 1)')
  })

  it('keeps a player inside the court while dragging', () => {
    render(<Whiteboard />)
    advance(16)

    drag(token('Atacante 1'), [{ x: 1, y: 1 }, { x: -4, y: 1 }], 500)

    seek(500)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(0 1)')
  })

  it('passes the ball to the teammate where it is released', () => {
    render(<Whiteboard />)
    advance(16)

    drag(token('Pelota'), [{ x: 10, y: 10.5 }, { x: 16, y: 9.5 }], 400)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(timeline()).toHaveAttribute('max', '400')
    seek(400)
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(16 9.5)')
  })

  it('shoots when the ball is released inside the goal', () => {
    render(<Whiteboard />)
    advance(16)

    drag(token('Pelota'), [{ x: 10, y: 10.5 }, { x: 10, y: -0.5 }], 300)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    seek(300)
    expect(token('Pelota')).toHaveAttribute('transform', 'translate(10 -0.5)')
  })

  it('discards a ball released away from every player and the goal', () => {
    render(<Whiteboard />)
    advance(16)

    drag(token('Pelota'), [{ x: 10, y: 10.5 }, { x: 10, y: 18 }], 400)

    expect(screen.getByRole('alert')).toHaveTextContent('La pelota tiene que terminar en un jugador o en el arco.')
    expect(timeline()).toHaveAttribute('max', '0')
  })

  it('shows the goalkeeper in the goal when enabled', () => {
    render(<Whiteboard />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Habilitar arquero' }))
    advance(16)

    expect(token('Arquero')).toHaveAttribute('transform', 'translate(10 0.5)')
  })

  it('plays the recorded layers and pauses at the end', () => {
    render(<Whiteboard />)
    advance(16)
    drag(token('Atacante 1'), [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }], 500)
    seek(0)

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir' }))
    advance(500)
    expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument()

    advance(600)
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(5 1)')
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeInTheDocument()
  })

  it('plays faster at 1.5x', () => {
    render(<Whiteboard />)
    advance(16)
    drag(token('Atacante 1'), [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }], 500)
    seek(0)

    fireEvent.change(screen.getByRole('combobox', { name: 'Velocidad' }), { target: { value: '1.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir' }))
    advance(1100)

    // 1.5 s of play take 1 s at 1.5x, so playback has ended; at 1x it would still be running (t = 1.1 s).
    expect(token('Atacante 1')).toHaveAttribute('transform', 'translate(4 1)')
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeInTheDocument()
  })
})
