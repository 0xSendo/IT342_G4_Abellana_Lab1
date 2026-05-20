import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import JobTrendsWidget from "../../components/JobTrendsWidget";
import "../../styles/common/bento.css";
import "../../styles/student/student-dashboard.css";
import "../../styles/admin/admin-dashboard.css";

export default function AdminDashboard() {
  const { currentUser, updateProfile, getUsers } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    department: currentUser?.department || "",
    phone: currentUser?.phone || "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, [getUsers]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile({
      name: form.name,
      email: form.email,
      department: form.department,
      phone: form.phone,
    });
    setStatus(res.ok ? "Profile updated." : res.message || "Update failed.");
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="student-dashboard-wrapper">
        <section className="student-hero">
          <div className="hero-aurora-bg">
            <div className="blob one"></div>
            <div className="blob two"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">System Administration</span>
              <h1>Welcome, System Admin {currentUser?.name?.split(" ")[0] || ""}! 👋</h1>
              <p>Monitor system health, manage users, and oversee the internship marketplace.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{users.length}</span>
                <span className="lab">Total Users</span>
              </div>
            </div>
          </div>
        </section>

        <div className="student-bento-grid">
          {/* Admin Profile Bento */}
          <section className="bento-card profile-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Admin Identity</span>
                <h3>{currentUser?.name || "Administrator"}</h3>
              </div>
            </div>
            
            <form className="form-grid-pro" onSubmit={onSave} style={{ marginTop: '20px' }}>
              <div className="input-group-pro">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={onChange} required />
              </div>
              <div className="input-group-pro">
                <label>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={onChange} required />
              </div>
              <div className="input-group-pro">
                <label>Department</label>
                <input name="department" value={form.department} onChange={onChange} placeholder="Career Services" />
              </div>
              <div className="input-group-pro">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="+63" />
              </div>
              <div className="modal-footer-pro full-width" style={{ marginTop: '20px', paddingBottom: 0 }}>
                {status && <span style={{ marginRight: 'auto', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{status}</span>}
                <button className="btn-primary-pro" type="submit">Update Profile</button>
              </div>
            </form>
          </section>

          {/* System Status Bento */}
          <section className="bento-card readiness-bento">
             <div className="bento-header">
              <div>
                <span className="bento-label">Quick Insights</span>
                <h3>System Status</h3>
              </div>
            </div>
            <div className="readiness-list">
              <div className="readiness-item done">
                <div className="check-circle">✓</div>
                <span className="task-text">Database Connected</span>
              </div>
              <div className="readiness-item done">
                <div className="check-circle">✓</div>
                <span className="task-text">Auth Service Active</span>
              </div>
              <div className="readiness-item">
                <div className="check-circle"></div>
                <span className="task-text">API Performance: Optimal</span>
              </div>
            </div>
          </section>

          <section className="bento-card trends-bento">
            <JobTrendsWidget />
          </section>

          {/* User Management Bento */}
          <section className="bento-card employer-postings-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Management</span>
                <h3>System Users</h3>
              </div>
            </div>

            <div className="postings-grid-pro">
              {users.length === 0 ? (
                <div className="market-status-overlay">
                  <p className="insight-text">No users found.</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="posting-card-pro">
                    <span className={`card-tag ${user.role === 'ADMIN' ? 'closed' : user.role === 'EMPLOYER' ? 'pending' : 'active'}`}>
                      {user.role}
                    </span>
                    <div className="card-body-pro">
                      <h4>{user.name}</h4>
                      <span className="loc">{user.email}</span>
                    </div>
                    <div className="card-actions-pro">
                      <button className="edit-btn-glass">Manage</button>
                      <button className="edit-btn-glass" style={{ color: '#ff6b6b' }}>Deactivate</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}