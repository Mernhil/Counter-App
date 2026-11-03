import { useRef, useState } from 'react'
import { addCounter, addTap, undoLastTap, updateTap } from '../db'
import { timeSince } from '../format'
import { useCounters, useNow, useTapsByCounter } from '../hooks'
import { countToday, lastTapTime, streaks } from '../stats'
import type { Counter } from '../types'
import { CounterForm } from './CounterForm'
import { Modal } from './Modal'

interface Toast {
  counter: Counter
  tapId: string
}

export function Home({ onOpenHistory }: { onOpenHistory: (id: string) => void }) {
  const counters = useCounters()
  const taps = useTapsByCounter()
  const now = useNow()
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [noteFor, setNoteFor] = useState<Toast | null>(null)
  const toastTimer = useRef<number>(undefined)

  if (!counters || !taps) return null

  async function tap(c: Counter) {
    const t = await addTap(c.id)
    navigator.vibrate?.(15)
    setToast({ counter: c, tapId: t.id })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 5000)
  }

  async function undo(c: Counter) {
    await undoLastTap(c.id)
    setToast(null)
  }

  return (
    <div className="screen">
      <header className="top">
        <h1>Today</h1>
        <button className="btn primary small" onClick={() => setAdding(true)}>
          + Counter
        </button>
      </header>

      {counters.length === 0 && (
        <div className="empty">
          <p>No counters yet.</p>
          <p>Create one for anything you want to count — coffee, headaches, workouts…</p>
          <button className="btn primary" onClick={() => setAdding(true)}>
            Create your first counter
          </button>
        </div>
      )}

      <div className="cards">
        {counters.map((c) => {
          const ts = (taps.get(c.id) ?? []).map((t) => t.timestamp)
          const s = streaks(ts, now)
          return (
            <section key={c.id} className="card" style={{ '--c': c.color } as React.CSSProperties}>
              <div className="card-head">
                <span className="card-name">
                  <span aria-hidden>{c.icon}</span> {c.name}
                </span>
                <button className="link" onClick={() => onOpenHistory(c.id)}>
                  History
                </button>
              </div>

              <button className="tap" onClick={() => tap(c)} aria-label={`Add one to ${c.name}`}>
                <span className="tap-count">{countToday(ts, now)}</span>
                <span className="tap-label">tap to add +1</span>
              </button>

              <div className="mini">
                <span>
                  <b>{s.current}</b> day streak
                </span>
                <span>
                  Last <b>{timeSince(lastTapTime(ts), now)}</b>
                </span>
                <button className="link" onClick={() => undo(c)} disabled={!ts.length}>
                  Undo
                </button>
              </div>
            </section>
          )
        })}
      </div>

      {toast && (
        <div className="toast" role="status">
          <span>
            {toast.counter.icon} +1 {toast.counter.name}
          </span>
          <button onClick={() => undo(toast.counter)}>Undo</button>
          <button
            onClick={() => {
              setNoteFor(toast)
              setToast(null)
            }}
          >
            Note
          </button>
        </div>
      )}

      {noteFor && <NoteModal toast={noteFor} onClose={() => setNoteFor(null)} />}

      {adding && (
        <CounterForm
          title="New counter"
          onClose={() => setAdding(false)}
          onSave={async (v) => {
            await addCounter(v.name, v.color, v.icon)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function NoteModal({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [note, setNote] = useState('')
  return (
    <Modal title={`Note for ${toast.counter.name}`} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await updateTap(toast.tapId, { note: note.trim() })
          onClose()
        }}
      >
        <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was going on?" />
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>
            Skip
          </button>
          <button type="submit" className="btn primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
