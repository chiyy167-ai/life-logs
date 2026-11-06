import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { monthMatrix, shiftMonth, todayKey } from '../lib/dates'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const days = useLiveQuery(() => db.days.toArray(), [])
  const activities = useLiveQuery(() => db.activities.toArray(), [])
  const attachments = useLiveQuery(() => db.attachments.toArray(), [])

  const marked = useMemo(() => {
    const set = new Set<string>()
    for (const d of days ?? []) {
      if (d.title || d.body || d.mood || d.weather) set.add(d.date)
    }
    for (const a of activities ?? []) set.add(a.date)
    for (const a of attachments ?? []) set.add(a.date)
    return set
  }, [days, activities, attachments])

  const rows = monthMatrix(year, month)
  const label = new Date(year, month, 1).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">日历</p>
          <h1>{label}</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="chip"
            onClick={() => {
              const next = shiftMonth(year, month, -1)
              setYear(next.year)
              setMonth(next.month)
            }}
          >
            上月
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              const next = shiftMonth(year, month, 1)
              setYear(next.year)
              setMonth(next.month)
            }}
          >
            下月
          </button>
        </div>
      </header>

      <div className="calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}
        {rows.flat().map((date, idx) =>
          date ? (
            <Link
              key={date}
              to={`/day/${date}`}
              className={[
                'calendar-day',
                marked.has(date) ? 'has-entry' : '',
                date === todayKey() ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span>{Number(date.slice(-2))}</span>
              {marked.has(date) ? <i className="dot" aria-hidden /> : null}
            </Link>
          ) : (
            <div key={`empty-${idx}`} className="calendar-day empty" />
          ),
        )}
      </div>
    </div>
  )
}
