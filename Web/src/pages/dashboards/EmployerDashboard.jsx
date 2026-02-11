import DashboardLayout from "../../components/DashboardLayout";

export default function EmployerDashboard() {
  return (
    <DashboardLayout title="Employer Dashboard">
      <section className="card">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Active Postings</span>
            <span className="stat-value">4</span>
            <span className="stat-trend positive">+2 this month</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">New Applicants</span>
            <span className="stat-value">18</span>
            <span className="stat-trend positive">+6 this week</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Shortlisted</span>
            <span className="stat-value">7</span>
            <span className="stat-trend">Review pending</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>My Internship Postings</h3>
        <div className="action-row">
          <button className="primary-btn" type="button">Post New Internship</button>
          <button className="action-btn" type="button">Manage Listings</button>
        </div>
        <ul className="list">
          <li>
            <div>
              <strong>Frontend Developer Intern</strong>
              <span className="muted">Makati • Posted 3 days ago</span>
            </div>
            <span className="chip chip-open">Open</span>
          </li>
          <li>
            <div>
              <strong>IT Support Intern</strong>
              <span className="muted">Cebu • Posted 2 weeks ago</span>
            </div>
            <span className="chip chip-closed">Closed</span>
          </li>
          <li>
            <div>
              <strong>Data Analyst Intern</strong>
              <span className="muted">Remote • Draft</span>
            </div>
            <span className="chip chip-draft">Draft</span>
          </li>
        </ul>
      </section>

      <section className="card">
        <h3>Recent Applicants</h3>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Internship</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Juan Dela Cruz</td>
              <td>Frontend Intern</td>
              <td><span className="status pending">Pending</span></td>
            </tr>
            <tr>
              <td>Maria Santos</td>
              <td>IT Support Intern</td>
              <td><span className="status accepted">Accepted</span></td>
            </tr>
            <tr>
              <td>Paolo Reyes</td>
              <td>Data Analyst Intern</td>
              <td><span className="status rejected">Rejected</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}
