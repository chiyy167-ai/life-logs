import { useState, type FormEvent } from 'react'
import { GateShell } from '../components/GateShell'
import { useAuth } from '../context/AuthContext'

export function SetupPage() {
  const { setup } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
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
    <GateShell
      kicker="第一次打开"
      title="给这本日记上锁"
      lede="设一个只有你知道的密码。忘了只能清空本机数据，所以请先记住它。"
    >
      <form onSubmit={onSubmit} className="stack-form">
        <label>
          怎么称呼你
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="可选"
            autoComplete="nickname"
          />
        </label>
        <label>
          访问密码
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          再输入一次
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <button type="button" className="text-btn" onClick={() => setShow((v) => !v)}>
          {show ? '隐藏密码' : '显示密码'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="primary-btn wide" disabled={busy}>
          {busy ? '创建中…' : '打开日记'}
        </button>
      </form>
    </GateShell>
  )
}
