import JSZip from 'jszip'
import { clearAllData, db } from '../db'
import type { Activity, AppMeta, AttachmentMeta, DayRecord } from '../db/types'
import { SCHEMA_VERSION } from './constants'

interface BackupPayload {
  version: number
  exportedAt: string
  meta: AppMeta | null
  days: DayRecord[]
  activities: Activity[]
  attachments: AttachmentMeta[]
}

export async function exportBackup(): Promise<Blob> {
  const [meta, days, activities, attachments] = await Promise.all([
    db.meta.get('app'),
    db.days.toArray(),
    db.activities.toArray(),
    db.attachments.toArray(),
  ])

  const payload: BackupPayload = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    meta: meta ?? null,
    days,
    activities,
    attachments: attachments.map(({ blob: _blob, ...metaOnly }) => metaOnly),
  }

  const zip = new JSZip()
  zip.file('manifest.json', JSON.stringify(payload, null, 2))
  const media = zip.folder('media')
  for (const att of attachments) {
    media?.file(att.id, att.blob)
  }
  return zip.generateAsync({ type: 'blob' })
}

export async function importBackup(file: File): Promise<void> {
  const zip = await JSZip.loadAsync(file)
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) throw new Error('备份包缺少 manifest.json')

  const payload = JSON.parse(await manifestFile.async('string')) as BackupPayload
  if (!payload.days || !payload.activities || !payload.attachments) {
    throw new Error('备份格式无效')
  }

  await clearAllData()

  if (payload.meta) {
    await db.meta.put({
      ...payload.meta,
      id: 'app',
      schemaVersion: SCHEMA_VERSION,
    })
  }

  if (payload.days.length) await db.days.bulkPut(payload.days)
  if (payload.activities.length) await db.activities.bulkPut(payload.activities)

  const mediaFolder = zip.folder('media')
  for (const meta of payload.attachments) {
    const entry = mediaFolder?.file(meta.id) ?? zip.file(`media/${meta.id}`)
    if (!entry) continue
    const blob = await entry.async('blob')
    await db.attachments.put({
      ...meta,
      blob: new Blob([blob], { type: meta.mime || blob.type }),
    })
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
