import { describe, expect, it } from 'vitest'
import { createPlaybackClock } from './playbackClock.js'

describe('createPlaybackClock', () => {
  it('starts paused at time zero', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    expect(clock.isPlaying()).toBe(false)
    expect(clock.timeAt(1000)).toBe(0)
  })

  it('advances with the elapsed time while playing', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(100)
    expect(clock.timeAt(600)).toBe(500)
  })

  it('freezes on pause and resumes from the paused time', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(0)
    clock.pause(1000)
    expect(clock.timeAt(3000)).toBe(1000)
    clock.play(3000)
    expect(clock.timeAt(3500)).toBe(1500)
  })

  it('jumps on seek and keeps playing from there', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(0)
    clock.seek(4000, 1000)
    expect(clock.timeAt(1500)).toBe(4500)
  })

  it('seeks backwards to rewind', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(0)
    clock.seek(500, 3000)
    expect(clock.timeAt(3000)).toBe(500)
  })

  it('clamps seeks to the play duration', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.seek(-200, 0)
    expect(clock.timeAt(0)).toBe(0)
    clock.seek(9000, 0)
    expect(clock.timeAt(0)).toBe(5000)
  })

  it('changes speed without jumping', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(0)
    clock.setRate(2, 1000)
    expect(clock.timeAt(1000)).toBe(1000)
    expect(clock.timeAt(1500)).toBe(2000)
  })

  it('stops at the end of the play', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(0)
    expect(clock.timeAt(8000)).toBe(5000)
    expect(clock.hasEnded(8000)).toBe(true)
  })

  it('restarts from the beginning when played after the end', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    clock.play(0)
    clock.pause(8000)
    clock.play(9000)
    expect(clock.timeAt(9100)).toBe(100)
  })

  it('rejects a speed that is not positive', () => {
    const clock = createPlaybackClock({ duration: 5000 })
    expect(() => clock.setRate(0, 0)).toThrow('Playback rate must be positive')
  })
})

describe('setDuration', () => {
  it('lets time run past the previous end while recording', () => {
    const clock = createPlaybackClock({ duration: 1000 })
    clock.setDuration(Infinity, 0)
    clock.play(0)
    expect(clock.timeAt(3000)).toBe(3000)
  })

  it('pulls the current time back when the play gets shorter', () => {
    const clock = createPlaybackClock({ duration: Infinity })
    clock.play(0)
    clock.pause(4000)
    clock.setDuration(2500, 4000)
    expect(clock.timeAt(4000)).toBe(2500)
  })
})
