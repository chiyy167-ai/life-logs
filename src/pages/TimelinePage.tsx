import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ObjectUrl } from '../components/ObjectUrl'
import { db } from '../db'
import type { Attachment, DayRecord } from '../db/types'
import { MOODS } from '../lib/constants'
import type { Mood } from '../db/types'
import { formatDisplayDate } from '../lib/dates'

interface TimelineItem {
  date: string
  day: DayRecord | null
  activities: string[]
  thumb: Attachment | null
}

export function TimelinePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorite' | Mood>('all')
  const days = useLiveQuery(() => db.days.toArray(), [])
  const activities = useLiveQuery(() => db.activities.toArray(), [])
  const attachments = useLiveQuery(() => db.attachments.toArray(), [])

  const allItems = useMemo(() => {
    const dayMap = new Map((days ?? []).map((d) => [d.date, d]))
    const activityMap = new Map<string, string[]>()
    for (const a of activities ?? []) {
      const list = activityMap.get(a.date) ?? []
      list.push(a.text)
      activityMap.set(a.date, list)
    }
    const thumbMap = new Map<string, Attachment>()
    for (const a of attachments ?? []) {
      if (!a.mime.startsWith('image/')) continue
      if (thumbMap.has(a.date)) continue
      thumbMap.set(a.date, a)
    }

    const dates = new Set<string>([
      ...dayMap.keys(),
      ...activityMap.keys(),
      ...thumbMap.keys(),
      ...(attachments ?? []).map((a) => a.date),
    ])

    return [...dates]
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        day: dayMap.get(date) ?? null,
        activities: activityMap.get(date) ?? [],
        thumb: thumbMap.get(date) ?? null,
      })) satisfies TimelineItem[]
  }, [days, activities, attachments])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allItems.filter((item) => {
      if (filter === 'favorite' && !item.day?.favorite) return false
      if (filter !== 'all' && filter !== 'favorite' && item.day?.mood !== filter) return false
      if (!q) return true
      const hay = [
        item.day?.title ?? '',
        item.day?.body ?? '',
        item.day?.highlight ?? '',
        item.day?.place ?? '',
        item.day?.people ?? '',
        ...(item.day?.tags ?? []),
        ...item.activities,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [allItems, query, filter])

  const randomRecall = () => {
    if (!allItems.length) return
    const pick = allItems[Math.floor(Math.random() * allItems.length)]
    navigate(`/day/${pick.date}`)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">回忆</p>
          <h1>时间线</h1>
        </div>
        <button type="button" className="primary-btn" onClick={randomRecall}>
          随机回忆
        </button>
      </header>

      <div className="filter-row">
        <button
          type="button"
          className={filter === 'all' ? 'chip active' : 'chip'}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          type="button"
          className={filter === 'favorite' ? 'chip active' : 'chip'}
          onClick={() => setFilter('favorite')}
        >
          收藏
        </button>
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            type="button"
            className={filter === mood.value ? 'chip active' : 'chip'}
            onClick={() => setFilter(mood.value)}
          >
            {mood.label}
          </button>
        ))}
      </div>

      <label className="field">
        搜索
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜正文、一句、地点、标签或活动…"
        />
      </label>

      <ul className="timeline">
        {items.map((item) => {
          const moodLabel = MOODS.find((m) => m.value === item.day?.mood)?.label
          return (
            <li key={item.date}>
              <Link to={`/day/${item.date}`} className="timeline-card">
                {item.thumb ? (
                  <ObjectUrl blob={item.thumb.blob}>
                    {(url) => <img src={url} alt="" className="timeline-thumb" />}
                  </ObjectUrl>
                ) : (
                  <div
                    className="timeline-thumb"
                    style={{ background: 'var(--accent-soft)' }}
                    aria-hidden
                  />
                )}
                <div>
                  <strong>{formatDisplayDate(item.date)}</strong>
                  <p>
                    {item.day?.highlight ||
                      item.day?.title ||
                      item.day?.body.slice(0, 80) ||
                      item.activities[0] ||
                      '这一天有记录'}
                  </p>
                  <div className="meta-row">
                    {item.day?.favorite ? <span>收藏</span> : null}
                    {moodLabel ? <span>{moodLabel}</span> : null}
                    {item.day?.weather ? <span>{item.day.weather.summary}</span> : null}
                    {item.day?.place ? <span>{item.day.place}</span> : null}
                    {item.activities.length ? <span>{item.activities.length} 条活动</span> : null}
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
        {!items.length ? <li className="muted">还没有可回忆的内容</li> : null}
      </ul>
    </div>
  )
}
