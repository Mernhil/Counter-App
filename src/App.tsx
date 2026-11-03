import { useState } from 'react'
import { getLastBackup } from './hooks'
import { History } from './components/History'
import { Home } from './components/Home'
import { Settings } from './components/Settings'
import { Stats } from './components/Stats'

type Tab = 'home' | 'stats' | 'settings'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '➕' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const WEEK = 7 * 24 * 3600 * 1000

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [historyId, setHistoryId] = useState<string | null>(null)
  const last = getLastBackup()
  const [dismissed, setDismissed] = useState(false)
  const backupDue = !dismissed && (!last || Date.now() - last > 2 * WEEK)

  return (
    <div className="app">
      <main>
        {backupDue && tab === 'home' && !historyId && (
          <div className="banner">
            <span>{last ? 'It has been a while since your last backup.' : 'You have never exported a backup.'}</span>
            <button className="link" onClick={() => setTab('settings')}>
              Back up
            </button>
            <button className="link" onClick={() => setDismissed(true)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}
        {historyId ? (
          <History counterId={historyId} onBack={() => setHistoryId(null)} />
        ) : tab === 'home' ? (
          <Home onOpenHistory={setHistoryId} />
        ) : tab === 'stats' ? (
          <Stats />
        ) : (
          <Settings />
        )}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab && !historyId ? 'on' : ''}
            onClick={() => {
              setHistoryId(null)
              setTab(t.id)
            }}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
