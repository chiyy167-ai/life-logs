import type { WeatherInfo } from '../db/types'

const WMO: Record<number, string> = {
  0: '晴朗',
  1: '大致晴朗',
  2: '局部多云',
  3: '阴天',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  56: '冻毛毛雨',
  57: '强冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '阵雨',
  82: '强阵雨',
  85: '小阵雪',
  86: '强阵雪',
  95: '雷暴',
  96: '雷暴伴冰雹',
  99: '强雷暴伴冰雹',
}

export function weatherSummary(code: number): string {
  return WMO[code] ?? `天气码 ${code}`
}

export async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('设备不支持定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 30 * 60_000,
    })
  })
}

export async function fetchWeather(
  lat: number,
  lon: number,
  date: string,
  source: 'geo' | 'manual',
  placeLabel?: string,
): Promise<WeatherInfo> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('start_date', date)
  url.searchParams.set('end_date', date)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('天气请求失败')
  const data = await res.json()
  const code = Number(data.daily?.weather_code?.[0] ?? 0)
  const tempMax = Number(data.daily?.temperature_2m_max?.[0] ?? 0)
  const tempMin = Number(data.daily?.temperature_2m_min?.[0] ?? 0)

  return {
    tempMax,
    tempMin,
    weatherCode: code,
    summary: weatherSummary(code),
    fetchedAt: new Date().toISOString(),
    source,
    lat,
    lon,
    placeLabel,
  }
}

/** Geocode city name via Open-Meteo (no API key). */
export async function geocodeCity(
  name: string,
): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'zh')
  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json()
  const hit = data.results?.[0]
  if (!hit) return null
  const parts = [hit.name, hit.admin1, hit.country].filter(Boolean)
  return { lat: hit.latitude, lon: hit.longitude, label: parts.join(' · ') }
}
