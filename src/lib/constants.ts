import type { Mood } from '../db/types'

export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const SCHEMA_VERSION = 1
export const SESSION_UNLOCK_KEY = 'life-logs-unlocked'

export const MOODS: { value: Mood; label: string }[] = [
  { value: 'great', label: '很好' },
  { value: 'good', label: '不错' },
  { value: 'ok', label: '一般' },
  { value: 'low', label: '低落' },
  { value: 'bad', label: '糟糕' },
]

export const ACCEPTED_FILE_TYPES =
  'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md'
