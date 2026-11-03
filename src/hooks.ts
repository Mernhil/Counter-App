import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Counter, Tap } from './types'

export function useCounters(): Counter[] | undefined {
  return useLiveQuery(() => db.counters.where('deleted').equals(0).sortBy('order'), [])
}

/** All live taps, grouped by counter id, newest first within each group. */
export function useTapsByCounter(): Map<string, Tap[]> | undefined {
  return useLiveQuery(async () => {
    const taps = await db.taps.where('deleted').equals(0).toArray()
    taps.sort((a, b) => b.timestamp - a.timestamp)
    const m = new Map<string, Tap[]>()
    for (const t of taps) {
      const list = m.get(t.counterId)
      if (list) list.push(t)
      else m.set(t.counterId, [t])
    }
    return m
  }, [])
}

/** Current time, refreshed every minute so "time since" labels stay fresh. */
export function useNow(): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export type ThemeChoice = 'system' | 'light' | 'dark'

export function applyTheme(choice: ThemeChoice) {
  const dark = choice === 'dark' || (choice === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function loadTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

export function saveTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem('theme', choice)
  } catch {
    /* storage unavailable */
  }
  applyTheme(choice)
}

export function getLastBackup(): number | null {
  try {
    const v = localStorage.getItem('lastBackup')
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export function setLastBackup(t: number) {
  try {
    localStorage.setItem('lastBackup', String(t))
  } catch {
    /* storage unavailable */
  }
}
