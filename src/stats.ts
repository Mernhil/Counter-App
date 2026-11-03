import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

/** Timestamps are ms since epoch; all functions use the local time zone. */
export type Timestamps = number[]

const dayKey = (t: number) => format(t, 'yyyy-MM-dd')

export function countBetween(ts: Timestamps, from: number, to: number): number {
  return ts.filter((t) => t >= from && t <= to).length
}

export function countToday(ts: Timestamps, now = Date.now()): number {
  return countBetween(ts, startOfDay(now).getTime(), endOfDay(now).getTime())
}

export function countThisWeek(ts: Timestamps, now = Date.now()): number {
  return countBetween(ts, startOfWeek(now, { weekStartsOn: 1 }).getTime(), now)
}

export function countThisMonth(ts: Timestamps, now = Date.now()): number {
  return countBetween(ts, startOfMonth(now).getTime(), now)
}

/** Map of yyyy-MM-dd -> count. */
export function countsByDay(ts: Timestamps): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of ts) m.set(dayKey(t), (m.get(dayKey(t)) ?? 0) + 1)
  return m
}

/** Average taps per day from the first tap's day through today (inclusive). */
export function averagePerDay(ts: Timestamps, now = Date.now()): number {
  if (!ts.length) return 0
  const first = Math.min(...ts)
  const days = differenceInCalendarDays(now, first) + 1
  return ts.length / Math.max(days, 1)
}

/** Counts for each of the last `days` days, oldest first. */
export function dailySeries(ts: Timestamps, days: number, now = Date.now()): { date: string; count: number }[] {
  const by = countsByDay(ts)
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(now, days - 1 - i)
    return { date: format(d, 'yyyy-MM-dd'), count: by.get(format(d, 'yyyy-MM-dd')) ?? 0 }
  })
}

/** 24 buckets, index = hour of day. */
export function byHour(ts: Timestamps): number[] {
  const out = new Array<number>(24).fill(0)
  for (const t of ts) out[new Date(t).getHours()]++
  return out
}

/** 7 buckets, index 0 = Monday ... 6 = Sunday. */
export function byWeekday(ts: Timestamps): number[] {
  const out = new Array<number>(7).fill(0)
  for (const t of ts) out[(new Date(t).getDay() + 6) % 7]++
  return out
}

export interface Streaks {
  /** Consecutive days with at least one tap, ending today (or yesterday if none yet today). */
  current: number
  longest: number
  /** Consecutive days with no tap, up to today. 0 if tapped today. */
  currentGap: number
  longestGap: number
}

export function streaks(ts: Timestamps, now = Date.now()): Streaks {
  if (!ts.length) return { current: 0, longest: 0, currentGap: 0, longestGap: 0 }
  const days = new Set(ts.map(dayKey))
  const first = startOfDay(Math.min(...ts))
  const today = startOfDay(now)

  let longest = 0
  let longestGap = 0
  let run = 0
  let gap = 0
  for (let d = first; d <= today; d = addDays(d, 1)) {
    if (days.has(dayKey(d.getTime()))) {
      run++
      gap = 0
      longest = Math.max(longest, run)
    } else {
      gap++
      run = 0
      longestGap = Math.max(longestGap, gap)
    }
  }
  const currentGap = gap
  // `run` ends on today; if today is empty but yesterday had a tap, the streak is still alive.
  let current = run
  if (current === 0) {
    current = 0
    for (let d = subDays(today, 1); days.has(dayKey(d.getTime())); d = subDays(d, 1)) current++
  }
  return { current, longest, currentGap, longestGap }
}

export function lastTapTime(ts: Timestamps): number | undefined {
  return ts.length ? Math.max(...ts) : undefined
}

export interface Comparison {
  current: number
  previous: number
  /** Percent change, or null when the previous period had zero. */
  changePct: number | null
}

function compare(current: number, previous: number): Comparison {
  return { current, previous, changePct: previous === 0 ? null : ((current - previous) / previous) * 100 }
}

/** This week so far vs the same elapsed span last week (Mon-based). */
export function weekVsLastWeek(ts: Timestamps, now = Date.now()): Comparison {
  const start = startOfWeek(now, { weekStartsOn: 1 }).getTime()
  const lastStart = subDays(start, 7).getTime()
  const elapsed = now - start
  return compare(countBetween(ts, start, now), countBetween(ts, lastStart, lastStart + elapsed))
}

/** Last 7 days vs the 7 days before that. */
export function trend7(ts: Timestamps, now = Date.now()): Comparison {
  const d7 = startOfDay(subDays(now, 6)).getTime()
  const d14 = startOfDay(subDays(now, 13)).getTime()
  return compare(countBetween(ts, d7, now), countBetween(ts, d14, d7 - 1))
}

export function monthKey(t: number) {
  return format(t, 'yyyy-MM')
}
