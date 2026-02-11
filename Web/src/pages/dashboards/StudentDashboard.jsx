import { useContext, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";

export default function StudentDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    program: currentUser?.program || "",
    yearLevel: currentUser?.yearLevel || "",
    skills: currentUser?.skills || "",
  });
  const [status, setStatus] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = (e) => {
    e.preventDefault();
    const res = updateProfile({
      name: form.name,
      email: form.email,
      program: form.program,
      yearLevel: form.yearLevel,
      skills: form.skills,
    });
    setStatus(res.ok ? "Profile updated." : res.message || "Update failed.");
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <section className="card">
        <h3>Student Profile</h3>
        <form className="profile-form" onSubmit={onSave}>
          <div className="profile-grid">
            <label>
              Full Name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={onChange} required />
            </label>
            <label>
              Program
              <input name="program" value={form.program} onChange={onChange} placeholder="BSIT" />
            </label>
            <label>
              Year Level
              <input name="yearLevel" value={form.yearLevel} onChange={onChange} placeholder="3rd Year" />
            </label>
            <label>
              Skills
              <input name="skills" value={form.skills} onChange={onChange} placeholder="Java, React, SQL" />
            </label>
          </div>
          <div className="profile-actions">
            <button className="primary-btn" type="submit">Save Profile</button>
            {status && <span className="profile-status">{status}</span>}
          </div>
        </form>
      </section>

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
