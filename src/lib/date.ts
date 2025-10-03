export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  // Accept both yyyy-mm-dd and full ISO
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`
}

export function toIsoFromLocalDateTime(local: string): string | null {
  // Expects input like 2025-10-03T17:30
  if (!local) return null
  const d = new Date(local)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}
