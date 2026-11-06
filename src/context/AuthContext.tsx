import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { db } from '../db'
import type { AppMeta } from '../db/types'
import { createSalt, hashPassword, verifyPassword } from '../lib/auth'
import { SCHEMA_VERSION, SESSION_UNLOCK_KEY } from '../lib/constants'

interface AuthContextValue {
  ready: boolean
  configured: boolean
  unlocked: boolean
  meta: AppMeta | null
  setup: (password: string, displayName: string) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  refreshMeta: () => Promise<void>
  updatePreferences: (
    patch: Partial<Pick<AppMeta, 'displayName' | 'cityLabel' | 'lat' | 'lon'>>,
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [meta, setMeta] = useState<AppMeta | null>(null)
  const [unlocked, setUnlocked] = useState(false)

  const refreshMeta = useCallback(async () => {
    const row = (await db.meta.get('app')) ?? null
    setMeta(row)
    return
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const row = (await db.meta.get('app')) ?? null
      if (cancelled) return
      setMeta(row)
      if (row && sessionStorage.getItem(SESSION_UNLOCK_KEY) === '1') {
        setUnlocked(true)
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setup = useCallback(async (password: string, displayName: string) => {
    const salt = createSalt()
    const passwordHash = await hashPassword(password, salt)
    const row: AppMeta = {
      id: 'app',
      displayName: displayName.trim() || '我',
      passwordHash,
      salt,
      cityLabel: '',
      lat: null,
      lon: null,
      schemaVersion: SCHEMA_VERSION,
    }
    await db.meta.put(row)
    setMeta(row)
    sessionStorage.setItem(SESSION_UNLOCK_KEY, '1')
    setUnlocked(true)
  }, [])

  const unlock = useCallback(
    async (password: string) => {
      if (!meta) return false
      const ok = await verifyPassword(password, meta.salt, meta.passwordHash)
      if (ok) {
        sessionStorage.setItem(SESSION_UNLOCK_KEY, '1')
        setUnlocked(true)
      }
      return ok
    },
    [meta],
  )

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY)
    setUnlocked(false)
  }, [])

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!meta) return false
      const ok = await verifyPassword(oldPassword, meta.salt, meta.passwordHash)
      if (!ok) return false
      const salt = createSalt()
      const passwordHash = await hashPassword(newPassword, salt)
      const next = { ...meta, salt, passwordHash }
      await db.meta.put(next)
      setMeta(next)
      return true
    },
    [meta],
  )

  const updatePreferences = useCallback(
    async (
      patch: Partial<Pick<AppMeta, 'displayName' | 'cityLabel' | 'lat' | 'lon'>>,
    ) => {
      if (!meta) return
      const next = { ...meta, ...patch }
      await db.meta.put(next)
      setMeta(next)
    },
    [meta],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured: Boolean(meta?.passwordHash),
      unlocked,
      meta,
      setup,
      unlock,
      lock,
      changePassword,
      refreshMeta,
      updatePreferences,
    }),
    [
      ready,
      meta,
      unlocked,
      setup,
      unlock,
      lock,
      changePassword,
      refreshMeta,
      updatePreferences,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
