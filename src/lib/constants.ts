import type { ActivityKind, Mood } from '../db/types'

export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const SCHEMA_VERSION = 1
export const SESSION_UNLOCK_KEY = 'life-logs-unlocked'

export const MOODS: { value: Mood; label: string; mark: string }[] = [
  { value: 'great', label: '很好', mark: '✦' },
  { value: 'good', label: '不错', mark: '◦' },
  { value: 'ok', label: '一般', mark: '·' },
  { value: 'low', label: '低落', mark: '▾' },
  { value: 'bad', label: '糟糕', mark: '–' },
]

export const WEATHER_CHOICES: { code: number; label: string; mark: string }[] = [
  { code: 0, label: '晴', mark: '☀' },
  { code: 2, label: '多云', mark: '☁' },
  { code: 3, label: '阴', mark: '▬' },
  { code: 45, label: '雾', mark: '〜' },
  { code: 61, label: '小雨', mark: '☂' },
  { code: 65, label: '大雨', mark: '☔' },
  { code: 80, label: '阵雨', mark: '⌁' },
  { code: 95, label: '雷雨', mark: '⚡' },
  { code: 71, label: '雪', mark: '❄' },
]

export const ACTIVITY_KINDS: { value: ActivityKind; label: string }[] = [
  { value: 'life', label: '生活' },
  { value: 'work', label: '工作' },
  { value: 'health', label: '身体' },
  { value: 'social', label: '见面' },
  { value: 'rest', label: '休息' },
]

export const WRITING_PROMPTS = [
  '今天最想记住的一个画面是什么？',
  '有没有一句别人说过、你还留着的话？',
  '哪件小事比预想中更好？',
  '如果只留一张照片，会是哪一刻？',
  '今天的身体感觉怎么样？',
]

export const ACCEPTED_FILE_TYPES =
  'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md'
