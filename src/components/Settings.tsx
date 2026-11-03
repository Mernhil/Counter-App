import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { exportData, importData } from '../db'
import { getLastBackup, loadTheme, saveTheme, setLastBackup, type ThemeChoice } from '../hooks'

export function Settings() {
  const [theme, setTheme] = useState<ThemeChoice>(loadTheme())
  const [last, setLast] = useState(getLastBackup())
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function doExport() {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-stats-backup-${format(Date.now(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    const now = Date.now()
    setLastBackup(now)
    setLast(now)
    setMessage(`Exported ${data.counters.length} counters and ${data.taps.length} taps.`)
  }

  async function doImport(file: File) {
    try {
      const r = await importData(JSON.parse(await file.text()))
      setMessage(`Imported ${r.counters} counters and ${r.taps} taps (newer data wins on conflicts).`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  return (
    <div className="screen">
      <h1>Settings</h1>

      <div className="panel">
        <h3>Theme</h3>
        <div className="seg">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              className={t === theme ? 'on' : ''}
              onClick={() => {
                setTheme(t)
                saveTheme(t)
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Backup</h3>
        <p className="muted">
          Your data lives only on this device. Export a backup regularly; import it to restore or to move data to another device.
        </p>
        <p>
          Last backup: <b>{last ? format(last, 'd MMM yyyy, HH:mm') : 'never'}</b>
        </p>
        <div className="row">
          <button className="btn primary" onClick={doExport}>
            Export backup
          </button>
          <button className="btn ghost" onClick={() => fileInput.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) doImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {message && <p role="status">{message}</p>}
      </div>
    </div>
  )
}
