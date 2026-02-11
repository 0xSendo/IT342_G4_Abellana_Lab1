import { useContext, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";

export default function AdminDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    department: currentUser?.department || "",
    phone: currentUser?.phone || "",
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
      department: form.department,
      phone: form.phone,
    });
    setStatus(res.ok ? "Profile updated." : res.message || "Update failed.");
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <section className="card">
        <h3>Admin Profile</h3>
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
              Department
              <input name="department" value={form.department} onChange={onChange} placeholder="Career Services" />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={onChange} placeholder="+63" />
            </label>
          </div>
          <div className="profile-actions">
            <button className="primary-btn" type="submit">Save Profile</button>
            {status && <span className="profile-status">{status}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">120</span>
            <span className="stat-trend positive">+8 this month</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Employers</span>
            <span className="stat-value">15</span>
            <span className="stat-trend">Stable</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Postings</span>
            <span className="stat-value">25</span>
            <span className="stat-trend positive">+4 this week</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Internship Monitoring</h3>
        <ul className="list">
          <li>
            <div>
              <strong>Active Postings</strong>
              <span className="muted">Across all employers</span>
            </div>
            <span className="chip chip-open">25</span>
          </li>
          <li>
            <div>
              <strong>Reported Listings</strong>
              <span className="muted">Requires review</span>
            </div>
            <span className="chip chip-draft">0</span>
          </li>
          <li>
            <div>
              <strong>Pending Approvals</strong>
              <span className="muted">New company requests</span>
            </div>
            <span className="chip chip-closed">3</span>
          </li>
        </ul>
      </section>
    </DashboardLayout>
  );
}
