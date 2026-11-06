import { useState, type FormEvent } from 'react'
import { GateShell } from '../components/GateShell'
import { useAuth } from '../context/AuthContext'

export function UnlockPage() {
  const { unlock, meta } = useAuth()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
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
    <GateShell
      kicker="已上锁"
      title={meta?.displayName ? `${meta.displayName}，欢迎回来` : '欢迎回来'}
      lede="本标签页解锁一次即可。关掉页面后需要再输入密码。"
    >
      <form onSubmit={onSubmit} className="stack-form">
        <label>
          访问密码
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        <button type="button" className="text-btn" onClick={() => setShow((v) => !v)}>
          {show ? '隐藏密码' : '显示密码'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="primary-btn wide" disabled={busy}>
          {busy ? '验证中…' : '进入日记'}
        </button>
      </form>
      <p className="hint">忘记密码只能清除本站数据后重设。换机前请先在设置里导出备份。</p>
    </GateShell>
  )
}
