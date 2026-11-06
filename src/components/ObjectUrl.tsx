import { useEffect, useState, type ReactNode } from 'react'

export function useObjectUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

export function ObjectUrl({
  blob,
  children,
}: {
  blob: Blob
  children: (url: string) => ReactNode
}) {
  const url = useObjectUrl(blob)
  if (!url) return null
  return children(url)
}
