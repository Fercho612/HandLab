import { describe, expect, it } from 'vitest'
import { simplifyTrajectory } from './simplifyTrajectory.js'

describe('simplifyTrajectory', () => {
  it('returns trajectories with two points or fewer unchanged', () => {
    const trajectory = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 1, y: 1 },
    ]
    expect(simplifyTrajectory(trajectory, 0.1)).toEqual(trajectory)
  })

  it('reduces a straight path at constant speed to its endpoints', () => {
    const trajectory = [0, 1, 2, 3, 4].map((i) => ({ t: i * 100, x: i, y: 0 }))
    expect(simplifyTrajectory(trajectory, 0.1)).toEqual([
      { t: 0, x: 0, y: 0 },
      { t: 400, x: 4, y: 0 },
    ])
  })

  it('keeps a corner that deviates more than the tolerance', () => {
    const trajectory = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 1, y: 0 },
      { t: 200, x: 2, y: 0 },
      { t: 300, x: 2, y: 1 },
      { t: 400, x: 2, y: 2 },
    ]
    expect(simplifyTrajectory(trajectory, 0.1)).toEqual([
      { t: 0, x: 0, y: 0 },
      { t: 200, x: 2, y: 0 },
      { t: 400, x: 2, y: 2 },
    ])
  })

  it('drops jitter within the tolerance', () => {
    const trajectory = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 1, y: 0.05 },
      { t: 200, x: 2, y: -0.05 },
      { t: 300, x: 3, y: 0 },
    ]
    expect(simplifyTrajectory(trajectory, 0.1)).toEqual([
      { t: 0, x: 0, y: 0 },
      { t: 300, x: 3, y: 0 },
    ])
  })

  it('keeps the timing of a pause even though the path is a straight line', () => {
    const trajectory = [
      { t: 0, x: 0, y: 0 },
      { t: 1000, x: 0, y: 0 },
      { t: 2000, x: 0, y: 0 },
      { t: 3000, x: 6, y: 0 },
    ]
    expect(simplifyTrajectory(trajectory, 0.1)).toEqual([
      { t: 0, x: 0, y: 0 },
      { t: 2000, x: 0, y: 0 },
      { t: 3000, x: 6, y: 0 },
    ])
  })

  it('does not mutate the input trajectory', () => {
    const trajectory = [0, 1, 2].map((i) => ({ t: i * 100, x: i, y: 0 }))
    const copy = structuredClone(trajectory)
    simplifyTrajectory(trajectory, 0.1)
    expect(trajectory).toEqual(copy)
  })
})
