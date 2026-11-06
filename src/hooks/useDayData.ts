import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '../db'
import type { DayRecord, Mood } from '../db/types'
import { MAX_FILE_BYTES } from '../lib/constants'
import { newId, nowTime, todayKey } from '../lib/dates'
import {
  fetchWeather,
  getCurrentPosition,
  geocodeCity,
} from '../lib/weather'
import { useAuth } from '../context/AuthContext'

function emptyDay(date: string): DayRecord {
  return {
    date,
    title: '',
    body: '',
    mood: '',
    weather: null,
    updatedAt: new Date().toISOString(),
  }
}

export function useDayData(date: string) {
  const { meta } = useAuth()
  const day = useLiveQuery(() => db.days.get(date), [date])
  const activities = useLiveQuery(
    () => db.activities.where('date').equals(date).sortBy('time'),
    [date],
  )
  const attachments = useLiveQuery(async () => {
    const rows = await db.attachments.where('date').equals(date).toArray()
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [date])

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState<Mood | ''>('')
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const [weatherError, setWeatherError] = useState('')
  const hydrated = useRef<string | null>(null)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    hydrated.current = null
  }, [date])

  useEffect(() => {
    if (day === undefined) return
    if (hydrated.current === date) return
    const source = day ?? emptyDay(date)
    setTitle(source.title)
    setBody(source.body)
    setMood(source.mood)
    hydrated.current = date
  }, [day, date])

  const persist = useCallback(
    async (next: { title: string; body: string; mood: Mood | '' }) => {
      const existing = await db.days.get(date)
      const record: DayRecord = {
        date,
        title: next.title,
        body: next.body,
        mood: next.mood,
        weather: existing?.weather ?? null,
        updatedAt: new Date().toISOString(),
      }
      const hasContent =
        record.title.trim() ||
        record.body.trim() ||
        record.mood ||
        record.weather
      const activityCount = await db.activities.where('date').equals(date).count()
      const attachmentCount = await db.attachments.where('date').equals(date).count()
      if (!hasContent && !activityCount && !attachmentCount) {
        if (existing) await db.days.delete(date)
        return
      }
      await db.days.put(record)
    },
    [date],
  )

  const scheduleSave = useCallback(
    (next: { title: string; body: string; mood: Mood | '' }) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void persist(next)
      }, 400)
    },
    [persist],
  )

  const updateTitle = (value: string) => {
    setTitle(value)
    scheduleSave({ title: value, body, mood })
  }

  const updateBody = (value: string) => {
    setBody(value)
    scheduleSave({ title, body: value, mood })
  }

  const updateMood = (value: Mood | '') => {
    setMood(value)
    scheduleSave({ title, body, mood: value })
  }

  const flushSave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    void persist({ title, body, mood })
  }, [persist, title, body, mood])

  const addActivity = async (text: string, time = nowTime()) => {
    const trimmed = text.trim()
    if (!trimmed) return
    await db.activities.add({
      id: newId(),
      date,
      time,
      text: trimmed,
    })
    const existing = await db.days.get(date)
    if (!existing) {
      await db.days.put({
        ...emptyDay(date),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const updateActivity = async (id: string, patch: { time?: string; text?: string }) => {
    await db.activities.update(id, patch)
  }

  const removeActivity = async (id: string) => {
    await db.activities.delete(id)
  }

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files]
    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`${file.name} 超过 50MB 限制`)
      }
      await db.attachments.add({
        id: newId(),
        date,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        createdAt: new Date().toISOString(),
        blob: file,
      })
    }
    const existing = await db.days.get(date)
    if (!existing) {
      await db.days.put({
        ...emptyDay(date),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const removeAttachment = async (id: string) => {
    await db.attachments.delete(id)
  }

  const refreshWeather = useCallback(async () => {
    setWeatherStatus('loading')
    setWeatherError('')
    try {
      let lat = meta?.lat ?? null
      let lon = meta?.lon ?? null
      let source: 'geo' | 'manual' = 'manual'
      let placeLabel = meta?.cityLabel || undefined

      if (lat == null || lon == null) {
        try {
          const pos = await getCurrentPosition()
          lat = pos.coords.latitude
          lon = pos.coords.longitude
          source = 'geo'
          placeLabel = '当前位置'
        } catch {
          if (meta?.cityLabel) {
            const geo = await geocodeCity(meta.cityLabel)
            if (!geo) throw new Error('无法解析城市，请在设置中修正')
            lat = geo.lat
            lon = geo.lon
            placeLabel = geo.label
            source = 'manual'
          } else {
            throw new Error('需要定位权限，或在设置中填写城市')
          }
        }
      } else {
        source = meta?.cityLabel ? 'manual' : 'geo'
      }

      const weather = await fetchWeather(lat, lon, date, source, placeLabel)
      const existing = (await db.days.get(date)) ?? emptyDay(date)
      await db.days.put({
        ...existing,
        weather,
        updatedAt: new Date().toISOString(),
      })
      setWeatherStatus('idle')
    } catch (err) {
      setWeatherStatus('error')
      setWeatherError(err instanceof Error ? err.message : '天气获取失败')
    }
  }, [date, meta])

  useEffect(() => {
    if (date !== todayKey()) return
    if (day === undefined) return
    if (day?.weather) return
    void refreshWeather()
  }, [date, day, refreshWeather])

  return {
    day: day ?? null,
    loading: day === undefined || activities === undefined || attachments === undefined,
    title,
    body,
    mood,
    activities: activities ?? [],
    attachments: attachments ?? [],
    updateTitle,
    updateBody,
    updateMood,
    flushSave,
    addActivity,
    updateActivity,
    removeActivity,
    addFiles,
    removeAttachment,
    refreshWeather,
    weatherStatus,
    weatherError,
  }
}
