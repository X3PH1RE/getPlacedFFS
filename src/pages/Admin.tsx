import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Admin() {
  return (
    <section className="section">
      <SectionHeader title="Admin Panel" subtitle="Create job posts, upload custom fields, export XLSX." />
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Button variant="ghost">New Job Post</Button>
          <Button>Upload Custom Fields</Button>
          <Button>Export XLSX</Button>
        </div>
      </Card>
    </section>
  )
}
