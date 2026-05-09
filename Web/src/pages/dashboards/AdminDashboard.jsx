import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import JobTrendsWidget from "../../components/JobTrendsWidget";
import "../../styles/dashboard.css";

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
        <h3>System Users</h3>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-row">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`chip ${user.role === 'ADMIN' ? 'chip-closed' : user.role === 'EMPLOYER' ? 'chip-draft' : 'chip-open'}`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{users.length}</span>
            <span className="stat-trend positive">Active on system</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Employers</span>
            <span className="stat-value">{users.filter(u => u.role === 'EMPLOYER').length}</span>
            <span className="stat-trend">Partners</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Students</span>
            <span className="stat-value">{users.filter(u => u.role === 'STUDENT').length}</span>
            <span className="stat-trend positive">Seeking internships</span>
          </div>
        </div>
      </section>

      <JobTrendsWidget />

    </DashboardLayout>
  );
}