import { addDays, format, startOfWeek, subWeeks } from 'date-fns'
import { countsByDay } from '../stats'

const CELL = 14
const GAP = 3

/** Calendar heatmap of the last `weeks` weeks, Monday-first columns. */
export function Heatmap({ timestamps, weeks = 26, now = Date.now() }: { timestamps: number[]; weeks?: number; now?: number }) {
  const by = countsByDay(timestamps)
  const max = Math.max(1, ...by.values())
  const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 })
  const cells: { x: number; y: number; key: string; n: number; future: boolean }[] = []
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const key = format(date, 'yyyy-MM-dd')
      cells.push({ x: w * (CELL + GAP), y: d * (CELL + GAP), key, n: by.get(key) ?? 0, future: date.getTime() > now })
    }
  }
  const width = weeks * (CELL + GAP)
  const height = 7 * (CELL + GAP)
  return (
    <div className="heatmap-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="Calendar heatmap">
        {cells
          .filter((c) => !c.future)
          .map((c) => (
            <rect key={c.key} x={c.x} y={c.y} width={CELL} height={CELL} rx={3} fill={c.n ? 'var(--c)' : 'var(--cell-empty)'} opacity={c.n ? 0.25 + 0.75 * (c.n / max) : 1}>
              <title>{`${c.key}: ${c.n}`}</title>
            </rect>
          ))}
      </svg>
    </div>
  )
}
