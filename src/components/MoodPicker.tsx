import { MOODS } from '../lib/constants'
import type { Mood } from '../db/types'

export function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | ''
  onChange: (mood: Mood | '') => void
}) {
  return (
    <div className="mood-picker" role="group" aria-label="心情">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          className={value === m.value ? 'chip active' : 'chip'}
          onClick={() => onChange(value === m.value ? '' : m.value)}
        >
          {m.mark} {m.label}
        </button>
      ))}
    </div>
  )
}
