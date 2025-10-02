type SectionHeaderProps = {
  title: string
  subtitle?: string
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="section">
      <div className="h1">{title}</div>
      {subtitle ? <div className="h2">{subtitle}</div> : null}
    </div>
  )
}
