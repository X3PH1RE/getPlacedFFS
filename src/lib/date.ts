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
