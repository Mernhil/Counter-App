import { describe, expect, it } from 'vitest'
import { averagePerDay, byHour, byWeekday, countToday, dailySeries, streaks, trend7, weekVsLastWeek } from './stats'

// Local-time helper; 2026-03-04 is a Wednesday.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()
const NOW = at(2026, 3, 4, 15)

describe('stats', () => {
  it('counts today', () => {
    expect(countToday([at(2026, 3, 4, 1), at(2026, 3, 4, 9), at(2026, 3, 3, 23)], NOW)).toBe(2)
  })

  it('averages per day from first tap day', () => {
    // taps over 4 calendar days (Mar 1..4): 8 taps -> 2/day
    const ts = [at(2026, 3, 1), ...Array(7).fill(at(2026, 3, 4))]
    expect(averagePerDay(ts, NOW)).toBe(2)
    expect(averagePerDay([], NOW)).toBe(0)
  })

  it('buckets by hour and weekday (Mon=0)', () => {
    const ts = [at(2026, 3, 4, 9), at(2026, 3, 4, 9), at(2026, 3, 1, 22)] // Wed, Wed, Sun
    expect(byHour(ts)[9]).toBe(2)
    expect(byHour(ts)[22]).toBe(1)
    const wd = byWeekday(ts)
    expect(wd[2]).toBe(2)
    expect(wd[6]).toBe(1)
  })

  it('builds a daily series with zero fill', () => {
    const s = dailySeries([at(2026, 3, 4), at(2026, 3, 2)], 3, NOW)
    expect(s.map((x) => x.count)).toEqual([1, 0, 1])
    expect(s[2].date).toBe('2026-03-04')
  })

  describe('streaks', () => {
    it('handles no data', () => {
      expect(streaks([], NOW)).toEqual({ current: 0, longest: 0, currentGap: 0, longestGap: 0 })
    })

    it('tracks current and longest streak and gaps', () => {
      // Feb 20-23 (4 days), gap Feb 24 - Mar 1 (6 days), Mar 2-4 (3 days)
      const ts = [20, 21, 22, 23].map((d) => at(2026, 2, d)).concat([2, 3, 4].map((d) => at(2026, 3, d)))
      expect(streaks(ts, NOW)).toEqual({ current: 3, longest: 4, currentGap: 0, longestGap: 6 })
    })

    it('keeps the streak alive when today is still empty', () => {
      const ts = [at(2026, 3, 2), at(2026, 3, 3)]
      const s = streaks(ts, NOW)
      expect(s.current).toBe(2)
      expect(s.currentGap).toBe(1)
    })

    it('reports a current gap when the streak is broken', () => {
      const s = streaks([at(2026, 3, 1)], NOW)
      expect(s.current).toBe(0)
      expect(s.currentGap).toBe(3)
    })
  })

  describe('comparisons', () => {
    it('compares this week so far vs the same span last week', () => {
      // Week starts Mon Mar 2. NOW = Wed 15:00. Last week span = Mon Feb 23 00:00 .. Wed Feb 25 15:00
      const ts = [at(2026, 3, 2), at(2026, 3, 3), at(2026, 3, 4, 10), at(2026, 2, 24), at(2026, 2, 28)]
      const c = weekVsLastWeek(ts, NOW)
      expect(c.current).toBe(3)
      expect(c.previous).toBe(1)
      expect(c.changePct).toBe(200)
    })

    it('returns null change when previous is zero', () => {
      expect(trend7([at(2026, 3, 4)], NOW).changePct).toBeNull()
    })
  })
})
