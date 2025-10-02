import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Dashboard() {
  return (
    <section className="section">
      <SectionHeader title="Live Applications" subtitle="Jobs posted by admin will appear here." />
      <div>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Example Company — SDE Intern</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Deadline: 2025-10-31</div>
          <div style={{ height: 12 }} />
          <Button>Apply</Button>
        </Card>
      </div>
    </section>
  )
}
