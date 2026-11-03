import { describe, expect, it } from 'vitest'
import { CourtStyle } from './courtStyles.js'
import { addStep, createDefaultPlay, resetPlay, setCourtStyle } from './play.js'

describe('court styles', () => {
  it('starts on the green court', () => {
    expect(createDefaultPlay().courtStyle).toBe(CourtStyle.GREEN)
  })

  it('changes the court style and keeps the rest of the play', () => {
    const play = addStep(createDefaultPlay())

    const updated = setCourtStyle(play, CourtStyle.WOOD)

    expect(updated.courtStyle).toBe(CourtStyle.WOOD)
    expect(updated.steps).toEqual(play.steps)
    expect(updated.players).toEqual(play.players)
    expect(updated.teamColors).toEqual(play.teamColors)
  })

  it('only accepts known styles', () => {
    expect(() => setCourtStyle(createDefaultPlay(), 'grass')).toThrow()
  })

  it('keeps the court style when the play is restarted', () => {
    const play = setCourtStyle(addStep(createDefaultPlay()), CourtStyle.CHALKBOARD)
    expect(resetPlay(play).courtStyle).toBe(CourtStyle.CHALKBOARD)
  })
})
