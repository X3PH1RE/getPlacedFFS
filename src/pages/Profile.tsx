import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'

export default function Profile() {
  return (
    <section className="section">
      <SectionHeader title="Your Profile" subtitle="Fill your details once. You can update anytime." />
      <Card>
        <div className="p">Profile form coming next (Name, Gender, Email, Contact, Dept, Course, DOB, Hometown, Languages, 10th, 12th/Diploma, UG CGPA, PG CGPA, Backlogs, YOP)</div>
      </Card>
    </section>
  )
}
