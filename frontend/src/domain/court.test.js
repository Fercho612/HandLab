import { describe, expect, it } from 'vitest'
import { clampToCourt, isInGoal } from './court.js'

describe('clampToCourt', () => {
  it('keeps points inside the half court unchanged', () => {
    expect(clampToCourt({ x: 7, y: 12 })).toEqual({ x: 7, y: 12 })
  })

  it('moves points outside the half court back to its edge', () => {
    expect(clampToCourt({ x: -3, y: 25 })).toEqual({ x: 0, y: 20 })
    expect(clampToCourt({ x: 21, y: -1 })).toEqual({ x: 20, y: 0 })
  })
})

describe('isInGoal', () => {
  it('detects points inside the goal mouth, behind the goal line', () => {
    expect(isInGoal({ x: 10, y: -0.5 })).toBe(true)
    expect(isInGoal({ x: 8.5, y: 0 })).toBe(true)
  })

  it('rejects points beside the goal or on the court', () => {
    expect(isInGoal({ x: 8, y: -0.5 })).toBe(false)
    expect(isInGoal({ x: 10, y: 0.5 })).toBe(false)
  })
})
