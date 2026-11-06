import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../db'
import type { ActivityKind, DayRecord, Mood, WeatherInfo } from '../db/types'
import { MAX_FILE_BYTES, WEATHER_CHOICES } from '../lib/constants'
import { newId, nowTime } from '../lib/dates'
import { fetchWeather, geocodeCity, getCurrentPosition, weatherSummary } from '../lib/weather'

export interface DayDraft {
  title: string
  body: string
  mood: Mood | ''
  highlight: string
  place: string
  people: string
  tags: string[]
  favorite: boolean
}

function emptyDay(date: string): DayRecord {
  return {
    date,
    title: '',
    body: '',
    mood: '',
    weather: null,
    highlight: '',
    place: '',
    people: '',
    tags: [],
    favorite: false,
    updatedAt: new Date().toISOString(),
  }
}

function toDraft(day: DayRecord | undefined, date: string): DayDraft {
  const source = day ?? emptyDay(date)
  return {
    title: source.title ?? '',
    body: source.body ?? '',
    mood: source.mood ?? '',
    highlight: source.highlight ?? '',
    place: source.place ?? '',
    people: source.people ?? '',
    tags: source.tags ?? [],
    favorite: Boolean(source.favorite),
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

  const [draft, setDraft] = useState<DayDraft>(() => toDraft(undefined, date))
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [weatherError, setWeatherError] = useState('')
  const hydrated = useRef<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => {
    hydrated.current = null
  }, [date])

  useEffect(() => {
    if (day === undefined) return
    if (hydrated.current === date) return
    const next = toDraft(day, date)
    setDraft(next)
    draftRef.current = next
    hydrated.current = date
  }, [day, date])

  const persist = useCallback(
    async (next: DayDraft) => {
      const existing = await db.days.get(date)
      const record: DayRecord = {
        ...(existing ?? emptyDay(date)),
        ...next,
        date,
        weather: existing?.weather ?? null,
        updatedAt: new Date().toISOString(),
      }
      const hasContent =
        record.title.trim() ||
        record.body.trim() ||
        record.highlight.trim() ||
        record.place.trim() ||
        record.people.trim() ||
        record.tags.length > 0 ||
        record.favorite ||
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
    (next: DayDraft) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void persist(next)
      }, 400)
    },
    [persist],
  )

  const patchDraft = (partial: Partial<DayDraft>) => {
    const next = { ...draftRef.current, ...partial }
    draftRef.current = next
    setDraft(next)
    scheduleSave(next)
  }

  const flushSave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    void persist(draftRef.current)
  }, [persist])

  const ensureDay = async () => {
    const existing = await db.days.get(date)
    if (!existing) {
      await db.days.put({ ...emptyDay(date), updatedAt: new Date().toISOString() })
    }
  }

  const addActivity = async (text: string, kind: ActivityKind = 'life', time = nowTime()) => {
    const trimmed = text.trim()
    if (!trimmed) return
    await db.activities.add({
      id: newId(),
      date,
      time,
      text: trimmed,
      kind,
    })
    await ensureDay()
  }

  const updateActivity = async (
    id: string,
    patch: { time?: string; text?: string; kind?: ActivityKind },
  ) => {
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
    await ensureDay()
  }

  const removeAttachment = async (id: string) => {
    await db.attachments.delete(id)
  }

  const writeWeather = async (weather: WeatherInfo | null) => {
    const existing = (await db.days.get(date)) ?? {
      ...emptyDay(date),
      ...draftRef.current,
    }
    if (!weather && !existing.title && !existing.body && !existing.mood) {
      const activityCount = await db.activities.where('date').equals(date).count()
      const attachmentCount = await db.attachments.where('date').equals(date).count()
      const hasText =
        draftRef.current.highlight ||
        draftRef.current.place ||
        draftRef.current.people ||
        draftRef.current.tags.length ||
        draftRef.current.favorite
      if (!activityCount && !attachmentCount && !hasText) {
        if (await db.days.get(date)) await db.days.delete(date)
        return
      }
    }
    await db.days.put({
      ...existing,
      ...draftRef.current,
      date,
      weather,
      updatedAt: new Date().toISOString(),
    })
  }

  const pickWeather = async (code: number, temp: number) => {
    const choice = WEATHER_CHOICES.find((item) => item.code === code)
    const weather: WeatherInfo = {
      tempMax: temp,
      tempMin: temp,
      weatherCode: code,
      summary: choice?.label ?? weatherSummary(code),
      fetchedAt: new Date().toISOString(),
      source: 'picked',
      placeLabel: '手选',
    }
    await writeWeather(weather)
  }

  const clearWeather = async () => {
    await writeWeather(null)
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
      }

      const weather = await fetchWeather(lat, lon, date, source, placeLabel)
      const existing = (await db.days.get(date)) ?? {
        ...emptyDay(date),
        ...draftRef.current,
      }
      await db.days.put({
        ...existing,
        ...draftRef.current,
        date,
        weather,
        updatedAt: new Date().toISOString(),
      })
      setWeatherStatus('idle')
    } catch (err) {
      setWeatherStatus('error')
      setWeatherError(err instanceof Error ? err.message : '天气获取失败')
    }
  }, [date, meta])

  return {
    day: day ?? null,
    loading: day === undefined || activities === undefined || attachments === undefined,
    draft,
    patchDraft,
    flushSave,
    activities: activities ?? [],
    attachments: attachments ?? [],
    addActivity,
    updateActivity,
    removeActivity,
    addFiles,
    removeAttachment,
    pickWeather,
    clearWeather,
    refreshWeather,
    weatherStatus,
    weatherError,
  }
}
