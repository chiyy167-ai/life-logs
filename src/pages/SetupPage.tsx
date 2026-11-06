import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function SetupPage() {
  const { setup } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 4) {
      setError('密码至少 4 位')
      return
    }
    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    setBusy(true)
    setError('')
    try {
      await setup(password, displayName)
    } catch {
      setError('设置失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate-page">
      <div className="gate-card">
        <p className="brand">Life Logs</p>
        <h1>创建你的私密日记</h1>
        <p className="lede">数据只存在本机浏览器。请记住密码——无法找回，只能清空后重设。</p>
        <form onSubmit={onSubmit} className="stack-form">
          <label>
            显示名（可选）
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="怎么称呼你"
              autoComplete="nickname"
            />
          </label>
          <label>
            访问密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            确认密码
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-btn wide" disabled={busy}>
            {busy ? '创建中…' : '开始使用'}
          </button>
        </form>
      </div>
    </div>
  )
}
