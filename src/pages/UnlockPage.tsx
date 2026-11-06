import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function UnlockPage() {
  const { unlock, meta } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const ok = await unlock(password)
    if (!ok) setError('密码不正确')
    setBusy(false)
  }

  return (
    <div className="gate-page">
      <div className="gate-card">
        <p className="brand">Life Logs</p>
        <h1>欢迎回来{meta?.displayName ? `，${meta.displayName}` : ''}</h1>
        <p className="lede">输入访问密码继续。本标签页内解锁一次即可。</p>
        <form onSubmit={onSubmit} className="stack-form">
          <label>
            访问密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-btn wide" disabled={busy}>
            {busy ? '验证中…' : '解锁'}
          </button>
        </form>
        <p className="hint">
          忘记密码？只能在浏览器中清除本站数据后重新设置。建议定期在设置页导出备份。
        </p>
      </div>
    </div>
  )
}
