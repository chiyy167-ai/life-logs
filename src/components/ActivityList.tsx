import { useState } from 'react'
import type { Activity, ActivityKind } from '../db/types'
import { ACTIVITY_KINDS } from '../lib/constants'

export function ActivityList({
  activities,
  onAdd,
  onUpdate,
  onRemove,
}: {
  activities: Activity[]
  onAdd: (text: string, kind?: ActivityKind, time?: string) => Promise<void>
  onUpdate: (id: string, patch: { time?: string; text?: string; kind?: ActivityKind }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [kind, setKind] = useState<ActivityKind>('life')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      await onAdd(draft, kind)
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <h2>这一天做了什么</h2>
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
            <select
              aria-label="类型"
              value={item.kind || 'life'}
              onChange={(e) => void onUpdate(item.id, { kind: e.target.value as ActivityKind })}
            >
              {ACTIVITY_KINDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
        <select
          aria-label="新活动类型"
          value={kind}
          onChange={(e) => setKind(e.target.value as ActivityKind)}
        >
          {ACTIVITY_KINDS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className="text-input"
          placeholder="记一条，比如散步、开会、做饭…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        <button type="button" className="primary-btn" onClick={() => void submit()} disabled={busy}>
          记下
        </button>
      </div>
    </section>
  )
}
