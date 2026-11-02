import { describe, expect, it } from 'vitest'
import { clampToCourt } from '../domain/court.js'
import { createTrajectoryRecorder } from './trajectoryRecorder.js'

describe('createTrajectoryRecorder', () => {
  it('returns the simplified trajectory of the drag when finished', () => {
    const recorder = createTrajectoryRecorder()
    recorder.start(1000, { x: 0, y: 5 })
    for (let i = 1; i <= 4; i++) recorder.sample(1000 + i * 100, { x: i, y: 5 })
    expect(recorder.finish()).toEqual([
      { t: 1000, x: 0, y: 5 },
      { t: 1400, x: 4, y: 5 },
    ])
  })

  it('applies the constraint to every sample', () => {
    const recorder = createTrajectoryRecorder({ constrain: clampToCourt })
    recorder.start(0, { x: 19, y: 10 })
    recorder.sample(100, { x: 25, y: 10 })
    expect(recorder.finish()).toEqual([
      { t: 0, x: 19, y: 10 },
      { t: 100, x: 20, y: 10 },
    ])
  })

  it('ignores samples that are not later than the previous one', () => {
    const recorder = createTrajectoryRecorder()
    recorder.start(0, { x: 0, y: 0 })
    recorder.sample(0, { x: 9, y: 9 })
    recorder.sample(100, { x: 1, y: 0 })
    recorder.sample(50, { x: 9, y: 9 })
    expect(recorder.finish()).toEqual([
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 1, y: 0 },
    ])
  })

  it('returns a single point when the element was not moved', () => {
    const recorder = createTrajectoryRecorder()
    recorder.start(200, { x: 3, y: 3 })
    expect(recorder.finish()).toEqual([{ t: 200, x: 3, y: 3 }])
  })

  it('rejects samples before the recording starts', () => {
    const recorder = createTrajectoryRecorder()
    expect(() => recorder.sample(0, { x: 0, y: 0 })).toThrow('Recording has not started')
  })
})
