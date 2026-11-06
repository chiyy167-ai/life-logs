import type { ReactNode } from 'react'
import { todayKey } from '../lib/dates'

export function GateShell({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string
  title: string
  lede: string
  children: ReactNode
}) {
  const today = todayKey()
  const [year, month, day] = today.split('-')

  return (
    <div className="gate-page">
      <section className="gate-hero" aria-hidden={false}>
        <p className="gate-mark">Life Logs</p>
        <p className="gate-date">
          <span>{year}</span>
          <strong>
            {month}.{day}
          </strong>
        </p>
        <p className="gate-line">把一天留下来。照片、天气、说过的话，都只在这台设备上。</p>
      </section>
      <section className="gate-card">
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
        {children}
      </section>
    </div>
  )
}
