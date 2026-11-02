import { describe, expect, it } from 'vitest'
import { positionAt } from './trajectory.js'

const trajectory = [
  { t: 0, x: 0, y: 0 },
  { t: 1000, x: 10, y: 0 },
  { t: 2000, x: 10, y: 20 },
]

describe('positionAt', () => {
  it('returns the sampled point when t matches a sample', () => {
    expect(positionAt(trajectory, 1000)).toEqual({ x: 10, y: 0 })
  })

  it('interpolates linearly between the two surrounding samples', () => {
    expect(positionAt(trajectory, 500)).toEqual({ x: 5, y: 0 })
    expect(positionAt(trajectory, 1750)).toEqual({ x: 10, y: 15 })
  })

  it('holds the first point before the trajectory starts', () => {
    expect(positionAt(trajectory, -100)).toEqual({ x: 0, y: 0 })
  })

  it('holds the last point after the trajectory ends', () => {
    expect(positionAt(trajectory, 5000)).toEqual({ x: 10, y: 20 })
  })

  it('returns the only point of a single-sample trajectory', () => {
    expect(positionAt([{ t: 300, x: 4, y: 2 }], 0)).toEqual({ x: 4, y: 2 })
  })

  it('throws on an empty trajectory', () => {
    expect(() => positionAt([], 0)).toThrow('Trajectory must have at least one point')
  })
})
