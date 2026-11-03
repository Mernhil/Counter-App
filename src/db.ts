import Dexie, { type EntityTable } from 'dexie'
import type { Counter, ExportFile, Tap } from './types'

export const db = new Dexie('life-stats-counter') as Dexie & {
  counters: EntityTable<Counter, 'id'>
  taps: EntityTable<Tap, 'id'>
}

db.version(1).stores({
  counters: 'id, order, deleted, updatedAt',
  taps: 'id, counterId, timestamp, deleted, updatedAt, [counterId+timestamp]',
})

const uid = () => crypto.randomUUID()

export const COLORS = ['#6c5ce7', '#e17055', '#00b894', '#0984e3', '#e84393', '#fdcb6e', '#00cec9', '#d63031']
export const ICONS = ['💧', '☕', '🚬', '🏃', '😴', '🍎', '💊', '🤧', '📱', '🎮', '🍺', '⭐']

export async function addCounter(name: string, color: string, icon: string): Promise<Counter> {
  const now = Date.now()
  const order = (await db.counters.count()) + 1
  const counter: Counter = { id: uid(), name: name.trim(), color, icon, order, createdAt: now, updatedAt: now, deleted: 0 }
  await db.counters.add(counter)
  return counter
}

export async function updateCounter(id: string, changes: Partial<Pick<Counter, 'name' | 'color' | 'icon'>>) {
  await db.counters.update(id, { ...changes, updatedAt: Date.now() })
}

/** Soft-deletes the counter and all of its taps. */
export async function deleteCounter(id: string) {
  const now = Date.now()
  await db.transaction('rw', db.counters, db.taps, async () => {
    await db.counters.update(id, { deleted: 1, updatedAt: now })
    await db.taps.where('counterId').equals(id).modify({ deleted: 1, updatedAt: now })
  })
}

export async function addTap(counterId: string, timestamp = Date.now(), note = ''): Promise<Tap> {
  const now = Date.now()
  const tap: Tap = { id: uid(), counterId, timestamp, note, createdAt: now, updatedAt: now, deleted: 0 }
  await db.taps.add(tap)
  return tap
}

export async function updateTap(id: string, changes: Partial<Pick<Tap, 'timestamp' | 'note'>>) {
  await db.taps.update(id, { ...changes, updatedAt: Date.now() })
}

export async function deleteTap(id: string) {
  await db.taps.update(id, { deleted: 1, updatedAt: Date.now() })
}

/** Removes the most recent live tap of a counter. Returns it, or undefined if none. */
export async function undoLastTap(counterId: string): Promise<Tap | undefined> {
  const taps = await db.taps.where('counterId').equals(counterId).filter((t) => !t.deleted).sortBy('timestamp')
  const last = taps[taps.length - 1]
  if (last) await deleteTap(last.id)
  return last
}

export async function exportData(): Promise<ExportFile> {
  const [counters, taps] = await Promise.all([db.counters.toArray(), db.taps.toArray()])
  return { app: 'life-stats-counter', version: 1, exportedAt: Date.now(), counters, taps }
}

/** Merges a backup into the database; for equal ids the newer updatedAt wins. */
export async function importData(file: unknown): Promise<{ counters: number; taps: number }> {
  const f = file as Partial<ExportFile>
  if (!f || f.app !== 'life-stats-counter' || f.version !== 1 || !Array.isArray(f.counters) || !Array.isArray(f.taps)) {
    throw new Error('This is not a Life Stats Counter backup file.')
  }
  const counters = f.counters
  const taps = f.taps
  await db.transaction('rw', db.counters, db.taps, async () => {
    const existingC = new Map((await db.counters.bulkGet(counters.map((c) => c.id))).map((c) => [c?.id, c]))
    await db.counters.bulkPut(counters.filter((c) => (existingC.get(c.id)?.updatedAt ?? -1) < c.updatedAt))
    const existingT = new Map((await db.taps.bulkGet(taps.map((t) => t.id))).map((t) => [t?.id, t]))
    await db.taps.bulkPut(taps.filter((t) => (existingT.get(t.id)?.updatedAt ?? -1) < t.updatedAt))
  })
  return { counters: counters.length, taps: taps.length }
}
