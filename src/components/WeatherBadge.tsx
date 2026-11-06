import type { WeatherInfo } from '../db/types'

export function WeatherBadge({
  weather,
  status,
  error,
  onRefresh,
}: {
  weather: WeatherInfo | null | undefined
  status: 'idle' | 'loading' | 'error'
  error?: string
  onRefresh: () => void
}) {
  return (
    <div className="weather-badge">
      {weather ? (
        <p>
          {weather.summary} · {Math.round(weather.tempMin)}° / {Math.round(weather.tempMax)}°
          {weather.placeLabel ? ` · ${weather.placeLabel}` : ''}
        </p>
      ) : (
        <p className="muted">{status === 'loading' ? '正在获取天气…' : '暂无天气'}</p>
      )}
      {status === 'error' && error ? <p className="error-text">{error}</p> : null}
      <button type="button" className="link-btn" onClick={onRefresh} disabled={status === 'loading'}>
        {weather ? '重新获取天气' : '获取天气'}
      </button>
    </div>
  )
}
