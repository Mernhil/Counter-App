export interface Counter {
  id: string
  name: string
  color: string
  icon: string
  order: number
  createdAt: number
  updatedAt: number
  /** 1 = soft-deleted (kept so a future sync can propagate the deletion). */
  deleted: 0 | 1
}

export interface Tap {
  id: string
  counterId: string
  /** Time the event happened, ms since epoch. */
  timestamp: number
  note: string
  createdAt: number
  updatedAt: number
  deleted: 0 | 1
}

export interface ExportFile {
  app: 'life-stats-counter'
  version: 1
  exportedAt: number
  counters: Counter[]
  taps: Tap[]
}
