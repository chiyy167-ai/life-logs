import { useEffect, useRef, useState, type FormEvent } from 'react'
import { clearAllData } from '../db'
import { useAuth } from '../context/AuthContext'
import { downloadBlob, exportBackup, importBackup } from '../lib/backup'
import { SESSION_UNLOCK_KEY } from '../lib/constants'
import { geocodeCity } from '../lib/weather'

export function SettingsPage() {
  const { meta, lock, changePassword, updatePreferences } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(meta?.displayName ?? '')
  const [city, setCity] = useState(meta?.cityLabel ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDisplayName(meta?.displayName ?? '')
    setCity(meta?.cityLabel ?? '')
  }, [meta])

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      let lat = meta?.lat ?? null
      let lon = meta?.lon ?? null
      let cityLabel = city.trim()
      if (cityLabel) {
        const geo = await geocodeCity(cityLabel)
        if (!geo) throw new Error('找不到该城市，请换个写法试试')
        lat = geo.lat
        lon = geo.lon
        cityLabel = geo.label
        setCity(geo.label)
      } else {
        lat = null
        lon = null
      }
      await updatePreferences({
        displayName: displayName.trim() || '我',
        cityLabel,
        lat,
        lon,
      })
      setMessage('偏好已保存')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (newPassword.length < 4) {
      setError('新密码至少 4 位')
      return
    }
    const ok = await changePassword(oldPassword, newPassword)
    if (!ok) {
      setError('旧密码不正确')
      return
    }
    setOldPassword('')
    setNewPassword('')
    setMessage('密码已更新')
  }

  const onExport = async () => {
    setBusy(true)
    setError('')
    try {
      const blob = await exportBackup()
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `life-logs-backup-${stamp}.zip`)
      setMessage('导出成功。换机请先安装 PWA，再导入此备份。')
    } catch {
      setError('导出失败')
    } finally {
      setBusy(false)
    }
  }

  const onImport = async (file: File) => {
    const confirmed = window.confirm(
      '导入将覆盖当前本机全部日记与附件，且不可撤销。确定继续？',
    )
    if (!confirmed) return
    setBusy(true)
    setError('')
    try {
      await importBackup(file)
      setMessage('导入完成。若密码也来自备份，请用备份时的密码解锁。')
      window.location.hash = '#/'
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setBusy(false)
    }
  }

  const wipe = async () => {
    const confirmed = window.confirm('确定清空本站全部数据并重置密码？')
    if (!confirmed) return
    await clearAllData()
    sessionStorage.removeItem(SESSION_UNLOCK_KEY)
    window.location.reload()
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">设置</p>
          <h1>备份与偏好</h1>
        </div>
        <button type="button" className="chip" onClick={lock}>
          锁定
        </button>
      </header>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="panel">
        <h2>资料与天气城市</h2>
        <form className="stack-form" onSubmit={saveProfile}>
          <label>
            显示名
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label>
            默认城市（定位失败时使用）
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例如：上海"
            />
          </label>
          <button type="submit" className="primary-btn" disabled={busy}>
            保存偏好
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>修改密码</h2>
        <form className="stack-form" onSubmit={onChangePassword}>
          <label>
            旧密码
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </label>
          <label>
            新密码
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary-btn">
            更新密码
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>备份与恢复</h2>
        <p className="hint">
          iOS 可能清理长期不用的网站数据。请定期导出备份。换机：先安装本 PWA，再导入 zip。
        </p>
        <div className="header-actions">
          <button type="button" className="primary-btn" onClick={() => void onExport()} disabled={busy}>
            导出备份
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            导入备份
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="panel">
        <h2>关于</h2>
        <p className="hint">
          Life Logs 是纯前端 PWA：日记与媒体保存在本机 IndexedDB，站点本身可公开托管。密码闸用于防止随手翻看，并非端到端加密。
        </p>
        <button type="button" className="danger-btn" onClick={() => void wipe()}>
          清空全部数据
        </button>
      </section>
    </div>
  )
}
