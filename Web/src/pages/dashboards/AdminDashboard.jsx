import DashboardLayout from "../../components/DashboardLayout";

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <section className="card">
        <h3>User Management</h3>
        <ul>
          <li>Student: 120</li>
          <li>Employers: 15</li>
        </ul>
      </section>

      <section className="card">
        <h3>Internship Monitoring</h3>
        <p>Active Postings: 25</p>
        <p>Reported Listings: 0</p>
      </section>
    </DashboardLayout>
  );
}
