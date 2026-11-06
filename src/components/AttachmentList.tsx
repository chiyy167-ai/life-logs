import { useState } from 'react'
import type { Attachment } from '../db/types'
import { ACCEPTED_FILE_TYPES } from '../lib/constants'
import { ObjectUrl, useObjectUrl } from './ObjectUrl'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PreviewModal({
  attachment,
  onClose,
}: {
  attachment: Attachment
  onClose: () => void
}) {
  const url = useObjectUrl(attachment.blob)
  if (!url) return null
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-head">
          <h3>{attachment.name}</h3>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {attachment.mime.startsWith('image/') ? (
          <img className="preview-media" src={url} alt={attachment.name} />
        ) : attachment.mime.startsWith('video/') ? (
          <video className="preview-media" src={url} controls />
        ) : (
          <a className="primary-btn" href={url} download={attachment.name}>
            下载 / 打开文件
          </a>
        )}
      </div>
    </div>
  )
}

export function AttachmentList({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: Attachment[]
  onAdd: (files: FileList) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Attachment | null>(null)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>附件</h2>
        <label className="primary-btn file-label">
          上传
          <input
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            multiple
            hidden
            onChange={async (e) => {
              const files = e.target.files
              if (!files?.length) return
              setError('')
              try {
                await onAdd(files)
              } catch (err) {
                setError(err instanceof Error ? err.message : '上传失败')
              } finally {
                e.target.value = ''
              }
            }}
          />
        </label>
      </div>
      <p className="hint">支持照片、视频、文档；单文件不超过 50MB。数据仅存本机。</p>
      {error ? <p className="error-text">{error}</p> : null}
      <ul className="attachment-list">
        {attachments.map((att) => (
          <li key={att.id} className="attachment-card">
            <button
              type="button"
              className="attachment-preview"
              onClick={() => setPreview(att)}
            >
              {att.mime.startsWith('image/') ? (
                <ObjectUrl blob={att.blob}>
                  {(url) => <img src={url} alt={att.name} />}
                </ObjectUrl>
              ) : att.mime.startsWith('video/') ? (
                <span className="file-chip">视频</span>
              ) : (
                <span className="file-chip">文档</span>
              )}
            </button>
            <div className="attachment-meta">
              <strong>{att.name}</strong>
              <span>{formatSize(att.size)}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label={`删除 ${att.name}`}
              onClick={() => void onRemove(att.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {preview ? (
        <PreviewModal attachment={preview} onClose={() => setPreview(null)} />
      ) : null}
    </section>
  )
}
