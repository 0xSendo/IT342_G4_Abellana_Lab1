import DashboardLayout from "../../components/DashboardLayout";

export default function StudentDashboard() {
  return (
    <DashboardLayout title="Student Dashboard">
      <section className="card">
        <h3>My Profile</h3>
        <p>Program: BSIT</p>
        <p>Year Level: 3rd Year</p>
        <p>Skills: Java, React, SQL</p>
      </section>

      <section className="card">
        <h3>My Applications</h3>
        <table>
          <thead>
            <tr>
              <th>Internship</th>
              <th>Company</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Web Developer Intern</td>
              <td>ABC Corp</td>
              <td className="status pending">Pending</td>
            </tr>
            <tr>
              <td>IT Support Intern</td>
              <td>XYZ Solutions</td>
              <td className="status accepted">Accepted</td>
            </tr>
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}
