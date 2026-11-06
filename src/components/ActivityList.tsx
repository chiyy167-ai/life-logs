import { useState } from 'react'
import type { Activity } from '../db/types'

export function ActivityList({
  activities,
  onAdd,
  onUpdate,
  onRemove,
}: {
  activities: Activity[]
  onAdd: (text: string, time?: string) => Promise<void>
  onUpdate: (id: string, patch: { time?: string; text?: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      await onAdd(draft)
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <h2>做了什么</h2>
      <ul className="activity-list">
        {activities.map((item) => (
          <li key={item.id} className="activity-row">
            <input
              className="time-input"
              type="time"
              value={item.time}
              onChange={(e) => void onUpdate(item.id, { time: e.target.value })}
              aria-label="时间"
            />
            <input
              className="text-input"
              value={item.text}
              onChange={(e) => void onUpdate(item.id, { text: e.target.value })}
              aria-label="活动"
            />
            <button
              type="button"
              className="icon-btn"
              aria-label="删除活动"
              onClick={() => void onRemove(item.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="add-row">
        <input
          className="text-input"
          placeholder="加一条今天做的事…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        <button type="button" className="primary-btn" onClick={() => void submit()} disabled={busy}>
          添加
        </button>
      </div>
    </section>
  )
}
