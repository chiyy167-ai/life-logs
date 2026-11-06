import Dexie, { type EntityTable } from 'dexie'
import type { Activity, AppMeta, Attachment, DayRecord } from './types'

export class LifeLogsDB extends Dexie {
  meta!: EntityTable<AppMeta, 'id'>
  days!: EntityTable<DayRecord, 'date'>
  activities!: EntityTable<Activity, 'id'>
  attachments!: EntityTable<Attachment, 'id'>

  constructor() {
    super('life-logs')
    this.version(1).stores({
      meta: 'id',
      days: 'date, updatedAt',
      activities: 'id, date, time',
      attachments: 'id, date, createdAt',
    })
  }
}

export const db = new LifeLogsDB()

export async function clearAllData() {
  await Promise.all([
    db.meta.clear(),
    db.days.clear(),
    db.activities.clear(),
    db.attachments.clear(),
  ])
}
