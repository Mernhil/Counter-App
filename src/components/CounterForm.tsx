import { useState } from 'react'
import { COLORS, ICONS } from '../db'
import { Modal } from './Modal'

interface Props {
  title: string
  initial?: { name: string; color: string; icon: string }
  onSave: (v: { name: string; color: string; icon: string }) => void
  onClose: () => void
  onDelete?: () => void
}

export function CounterForm({ title, initial, onSave, onClose, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0])

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onSave({ name: name.trim(), color, icon })
        }}
      >
        <label className="field">
          Name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coffee" maxLength={40} />
        </label>
        <div className="field">
          Color
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={`Color ${c}`}
                aria-pressed={c === color}
                className={`swatch${c === color ? ' on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="field">
          Icon
          <div className="swatches">
            {ICONS.map((i) => (
              <button type="button" key={i} aria-pressed={i === icon} className={`icon-pick${i === icon ? ' on' : ''}`} onClick={() => setIcon(i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="row end">
          {onDelete && (
            <button type="button" className="btn danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!name.trim()}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
