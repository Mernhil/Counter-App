import { useState } from 'react'
import { format } from 'date-fns'
import { addTap, deleteCounter, deleteTap, updateCounter, updateTap } from '../db'
import { useCounters, useTapsByCounter } from '../hooks'
import type { Tap } from '../types'
import { CounterForm } from './CounterForm'
import { Modal } from './Modal'

const INPUT_FMT = "yyyy-MM-dd'T'HH:mm"

export function History({ counterId, onBack }: { counterId: string; onBack: () => void }) {
  const counters = useCounters()
  const taps = useTapsByCounter()
  const [editing, setEditing] = useState<Tap | 'new' | null>(null)
  const [editingCounter, setEditingCounter] = useState(false)

  const counter = counters?.find((c) => c.id === counterId)
  if (!counters || !taps) return null
  if (!counter) {
    return (
      <div className="screen">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <p>This counter no longer exists.</p>
      </div>
    )
  }
  const list = taps.get(counterId) ?? []

  return (
    <div className="screen" style={{ '--c': counter.color } as React.CSSProperties}>
      <header className="top">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <button className="link" onClick={() => setEditingCounter(true)}>
          Edit counter
        </button>
      </header>
      <h1>
        {counter.icon} {counter.name}
      </h1>
      <p className="muted">{list.length} taps in total</p>
      <button className="btn primary" onClick={() => setEditing('new')}>
        + Add a past tap
      </button>

      <ul className="history">
        {list.map((t) => (
          <li key={t.id}>
            <button className="history-item" onClick={() => setEditing(t)}>
              <span className="when">{format(t.timestamp, 'EEE d MMM yyyy, HH:mm')}</span>
              {t.note && <span className="note">{t.note}</span>}
            </button>
          </li>
        ))}
        {!list.length && <li className="muted">No taps yet.</li>}
      </ul>

      {editing && <TapEditor counterId={counterId} tap={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}

      {editingCounter && (
        <CounterForm
          title="Edit counter"
          initial={counter}
          onClose={() => setEditingCounter(false)}
          onSave={async (v) => {
            await updateCounter(counter.id, v)
            setEditingCounter(false)
          }}
          onDelete={async () => {
            if (confirm(`Delete "${counter.name}" and all its taps?`)) {
              await deleteCounter(counter.id)
              onBack()
            }
          }}
        />
      )}
    </div>
  )
}

function TapEditor({ counterId, tap, onClose }: { counterId: string; tap?: Tap; onClose: () => void }) {
  const [when, setWhen] = useState(format(tap?.timestamp ?? Date.now(), INPUT_FMT))
  const [note, setNote] = useState(tap?.note ?? '')
  const ts = new Date(when).getTime()
  const valid = !Number.isNaN(ts)

  return (
    <Modal title={tap ? 'Edit tap' : 'Add a past tap'} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!valid) return
          if (tap) await updateTap(tap.id, { timestamp: ts, note: note.trim() })
          else await addTap(counterId, ts, note.trim())
          onClose()
        }}
      >
        <label className="field">
          When
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <label className="field">
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </label>
        <div className="row end">
          {tap && (
            <button
              type="button"
              className="btn danger"
              onClick={async () => {
                await deleteTap(tap.id)
                onClose()
              }}
            >
              Delete
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!valid}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
