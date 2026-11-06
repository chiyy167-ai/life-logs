export type Mood = 'great' | 'good' | 'ok' | 'low' | 'bad'

export interface WeatherInfo {
  tempMax: number
  tempMin: number
  weatherCode: number
  summary: string
  fetchedAt: string
  source: 'geo' | 'manual'
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
  updatedAt: string
}

export interface Activity {
  id: string
  date: string
  time: string
  text: string
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
