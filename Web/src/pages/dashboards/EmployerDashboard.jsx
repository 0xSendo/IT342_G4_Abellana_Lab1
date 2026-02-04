import DashboardLayout from "../../components/DashboardLayout";

export default function EmployerDashboard() {
  return (
    <DashboardLayout title="Employer Dashboard">
      <section className="card">
        <h3>My Internship Postings</h3>
        <ul>
          <li>Frontend Developer Intern (Open)</li>
          <li>IT Support Intern (Closed)</li>
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
              <td>Pending</td>
            </tr>
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}
