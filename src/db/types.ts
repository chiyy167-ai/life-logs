export type Mood = 'great' | 'good' | 'ok' | 'low' | 'bad'

export interface WeatherInfo {
  tempMax: number
  tempMin: number
  weatherCode: number
  summary: string
  fetchedAt: string
  source: 'geo' | 'manual' | 'picked'
  lat?: number
  lon?: number
  placeLabel?: string
}

export interface DayRecord {
  date: string
  title: string
  body: string
  mood: Mood | ''
  weather: WeatherInfo | null
  highlight: string
  place: string
  people: string
  tags: string[]
  favorite: boolean
  updatedAt: string
}

export type ActivityKind = 'life' | 'work' | 'health' | 'social' | 'rest'

export interface Activity {
  id: string
  date: string
  time: string
  text: string
  kind: ActivityKind
}

export interface AttachmentMeta {
  id: string
  date: string
  name: string
  mime: string
  size: number
  createdAt: string
}

export interface Attachment extends AttachmentMeta {
  blob: Blob
}

export interface AppMeta {
  id: 'app'
  displayName: string
  passwordHash: string
  salt: string
  cityLabel: string
  lat: number | null
  lon: number | null
  schemaVersion: number
}
