import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtNum, timeSince, WEEKDAYS } from '../format'
import { useCounters, useNow, useTapsByCounter } from '../hooks'
import {
  averagePerDay,
  byHour,
  byWeekday,
  countThisMonth,
  countThisWeek,
  countToday,
  dailySeries,
  lastTapTime,
  streaks,
  trend7,
  weekVsLastWeek,
  type Comparison,
} from '../stats'
import { Heatmap } from './Heatmap'

function Num({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="num">
      <div className="num-value">{value}</div>
      <div className="num-label">{label}</div>
      {sub && <div className="num-sub">{sub}</div>}
    </div>
  )
}

function cmpText(c: Comparison): string {
  if (c.changePct === null) return c.current ? 'new activity' : 'no change'
  const arrow = c.changePct > 0 ? '▲' : c.changePct < 0 ? '▼' : '='
  return `${arrow} ${Math.abs(Math.round(c.changePct))}%`
}

const axis = { fontSize: 11, fill: 'var(--muted)' }
const tooltip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' } }

export function Stats() {
  const counters = useCounters()
  const taps = useTapsByCounter()
  const now = useNow()
  const [selected, setSelected] = useState<string | null>(null)
  const [range, setRange] = useState(30)

  if (!counters || !taps) return null
  if (!counters.length) {
    return (
      <div className="screen">
        <h1>Stats</h1>
        <p className="muted">Create a counter and log some taps to see stats here.</p>
      </div>
    )
  }

  const counter = counters.find((c) => c.id === selected) ?? counters[0]
  const ts = (taps.get(counter.id) ?? []).map((t) => t.timestamp)
  const s = streaks(ts, now)
  const series = dailySeries(ts, range, now).map((d) => ({ ...d, label: format(parseISO(d.date), 'd MMM') }))
  const hours = byHour(ts).map((count, h) => ({ label: String(h), count }))
  const weekdays = byWeekday(ts).map((count, i) => ({ label: WEEKDAYS[i], count }))
  const wk = weekVsLastWeek(ts, now)
  const t7 = trend7(ts, now)

  return (
    <div className="screen" style={{ '--c': counter.color } as React.CSSProperties}>
      <h1>Stats</h1>

      <div className="chips" role="tablist">
        {counters.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === counter.id}
            className={`chip${c.id === counter.id ? ' on' : ''}`}
            style={{ '--c': c.color } as React.CSSProperties}
            onClick={() => setSelected(c.id)}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="grid">
        <div className="panel">
          <h3>Totals &amp; averages</h3>
          <div className="nums">
            <Num label="Today" value={countToday(ts, now)} />
            <Num label="This week" value={countThisWeek(ts, now)} />
            <Num label="This month" value={countThisMonth(ts, now)} />
            <Num label="All time" value={ts.length} />
            <Num label="Avg / day" value={fmtNum(Math.round(averagePerDay(ts, now) * 10) / 10)} />
          </div>
        </div>

        <div className="panel">
          <h3>Streaks &amp; gaps</h3>
          <div className="nums">
            <Num label="Current streak" value={s.current} sub="days" />
            <Num label="Longest streak" value={s.longest} sub="days" />
            <Num label="Current gap" value={s.currentGap} sub="days without" />
            <Num label="Longest gap" value={s.longestGap} sub="days without" />
            <Num label="Since last" value={timeSince(lastTapTime(ts), now)} />
          </div>
        </div>

        <div className="panel">
          <h3>Trends</h3>
          <div className="nums">
            <Num label="This week vs last" value={cmpText(wk)} sub={`${wk.current} vs ${wk.previous}`} />
            <Num label="Last 7 days vs prior 7" value={cmpText(t7)} sub={`${t7.current} vs ${t7.previous}`} />
          </div>
        </div>

        <div className="panel wide">
          <div className="panel-head">
            <h3>Per day</h3>
            <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Range">
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={series}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={axis} interval="preserveStartEnd" minTickGap={24} />
              <YAxis allowDecimals={false} tick={axis} width={28} />
              <Tooltip {...tooltip} cursor={{ fill: 'var(--cell-empty)' }} />
              <Bar dataKey="count" name="Taps" fill="var(--c)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Busiest hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hours}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={axis} interval={2} />
              <YAxis allowDecimals={false} tick={axis} width={28} />
              <Tooltip {...tooltip} cursor={{ fill: 'var(--cell-empty)' }} labelFormatter={(h) => `${h}:00`} />
              <Bar dataKey="count" name="Taps" fill="var(--c)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Busiest days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekdays}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={axis} />
              <YAxis allowDecimals={false} tick={axis} width={28} />
              <Tooltip {...tooltip} cursor={{ fill: 'var(--cell-empty)' }} />
              <Bar dataKey="count" name="Taps" fill="var(--c)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel wide">
          <h3>Last 26 weeks</h3>
          <Heatmap timestamps={ts} now={now} />
        </div>

        {counters.length > 1 && (
          <div className="panel wide">
            <h3>Compare counters</h3>
            <table className="compare">
              <thead>
                <tr>
                  <th />
                  <th>Today</th>
                  <th>Week</th>
                  <th>Month</th>
                  <th>Avg/day</th>
                  <th>Streak</th>
                  <th>vs last wk</th>
                </tr>
              </thead>
              <tbody>
                {counters.map((c) => {
                  const cts = (taps.get(c.id) ?? []).map((t) => t.timestamp)
                  return (
                    <tr key={c.id}>
                      <th scope="row">
                        {c.icon} {c.name}
                      </th>
                      <td>{countToday(cts, now)}</td>
                      <td>{countThisWeek(cts, now)}</td>
                      <td>{countThisMonth(cts, now)}</td>
                      <td>{fmtNum(Math.round(averagePerDay(cts, now) * 10) / 10)}</td>
                      <td>{streaks(cts, now).current}</td>
                      <td>{cmpText(weekVsLastWeek(cts, now))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
