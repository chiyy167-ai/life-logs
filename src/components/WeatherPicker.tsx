import { useEffect, useState } from 'react'
import type { WeatherInfo } from '../db/types'
import { WEATHER_CHOICES } from '../lib/constants'

export function WeatherPicker({
  weather,
  status,
  error,
  onPick,
  onClear,
  onRefresh,
}: {
  weather: WeatherInfo | null | undefined
  status: 'idle' | 'loading' | 'error'
  error?: string
  onPick: (code: number, temp: number) => Promise<void>
  onClear: () => Promise<void>
  onRefresh: () => Promise<void>
}) {
  const [temp, setTemp] = useState(() =>
    weather ? Math.round((weather.tempMax + weather.tempMin) / 2) : 22,
  )

  useEffect(() => {
    if (!weather) return
    setTemp(Math.round((weather.tempMax + weather.tempMin) / 2))
  }, [weather])

  return (
    <section className="weather-panel">
      <div className="weather-head">
        <div>
          <p className="eyebrow">天气</p>
          <strong>
            {weather
              ? `${weather.summary} · ${Math.round(weather.tempMin)}°${
                  weather.tempMax !== weather.tempMin ? ` / ${Math.round(weather.tempMax)}°` : ''
                }`
              : '还没记下天气'}
          </strong>
          {weather?.placeLabel ? <span className="muted"> {weather.placeLabel}</span> : null}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="chip"
            disabled={status === 'loading'}
            onClick={() => void onRefresh()}
          >
            {status === 'loading' ? '获取中…' : '自动获取'}
          </button>
          {weather ? (
            <button type="button" className="chip" onClick={() => void onClear()}>
              清除
            </button>
          ) : null}
        </div>
      </div>
      <div className="weather-choices" role="group" aria-label="选择天气">
        {WEATHER_CHOICES.map((choice) => (
          <button
            key={choice.code}
            type="button"
            className={weather?.weatherCode === choice.code ? 'wx-btn active' : 'wx-btn'}
            onClick={() => void onPick(choice.code, temp)}
          >
            <span>{choice.mark}</span>
            {choice.label}
          </button>
        ))}
      </div>
      <label className="temp-row">
        气温 {temp}°
        <input
          type="range"
          min={-20}
          max={45}
          value={temp}
          onChange={(e) => {
            const next = Number(e.target.value)
            setTemp(next)
            if (weather?.source === 'picked') void onPick(weather.weatherCode, next)
          }}
        />
      </label>
      {status === 'error' && error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}
