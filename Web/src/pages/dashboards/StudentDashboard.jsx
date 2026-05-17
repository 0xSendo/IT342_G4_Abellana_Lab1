import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget"; 
import "../../styles/common/bento.css";
import "../../styles/student/student-dashboard.css";
import "../../styles/notifications.css";

export default function StudentDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const toast = useToast();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    program: currentUser?.program || "",
    yearLevel: currentUser?.yearLevel || "",
    skills: currentUser?.skills || "",
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const fetchMyApplications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await fetch(`${API_BASE}/api/applications/my-applications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(app => ({
          id: app.id,
          internship: app.internshipTitle,
          company: app.company,
          location: "See Posting", 
          setup: "See Posting",
          dateApplied: app.appliedAt,
          status: app.status,
          studentNote: "Application submitted via portal."
        }));
        setApplications(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      program: currentUser?.program || "",
      yearLevel: currentUser?.yearLevel || "",
      skills: currentUser?.skills || "",
    });
  }, [currentUser]);

  const normalizedSearch = applicationSearch.trim().toLowerCase();

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      app.internship.toLowerCase().includes(normalizedSearch) ||
      app.company.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  const totalApplications = applications.length;
  const pendingApplications = applications.filter((app) => app.status === "PENDING").length;

  const profileFields = [
    currentUser?.name,
    currentUser?.email,
    currentUser?.program,
    currentUser?.yearLevel,
    currentUser?.skills,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter((field) => !!String(field || "").trim()).length / profileFields.length) * 100
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const openApplicationModal = (application) => {
    setSelectedApplication(application);
    setIsApplicationModalOpen(true);
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setIsApplicationModalOpen(false);
  };

  const withdrawApplication = (applicationId) => {
    setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    if (selectedApplication?.id === applicationId) closeApplicationModal();
    toast.show("Application withdrawn");
  };

  const onSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.ok) {
      toast.show("Profile updated successfully");
      setTimeout(closeProfileModal, 800);
    } else {
      toast.show(res.message || "Update failed", "error");
    }
  };

  const readinessChecklist = [
    { id: 'info', text: 'Basic Information', done: !!(currentUser?.name && currentUser?.program && currentUser?.yearLevel) },
    { id: 'skills', text: 'Add Skills & Expertise', done: !!(currentUser?.skills?.trim()) },
    { id: 'app', text: 'First Application Sent', done: totalApplications > 0 }
  ];

  return (
    <DashboardLayout 
      showProfileCard={false}
      onNotificationClick={() => setIsNotificationsModalOpen(true)}
      notificationCount={notifications.filter(n => !n.read).length}
    >
      <div className="student-dashboard-wrapper">
        <section className="student-hero">
          <div className="hero-aurora-bg">
            <div className="blob one"></div>
            <div className="blob two"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">Student Portal</span>
              <h1>Welcome back, {currentUser?.name?.split(" ")[0] || "Student"}! 👋</h1>
              <p>Your internship journey starts here. Track applications, discover opportunities, and build your career.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{totalApplications}</span>
                <span className="lab">Total Apps</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{pendingApplications}</span>
                <span className="lab">Pending</span>
              </div>
            </div>
          </div>
        </section>

        <div className="student-bento-grid">
          {/* Profile Bento */}
          <section className="bento-card profile-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">My Identity</span>
                <h3>{currentUser?.name || "Student Profile"}</h3>
              </div>
              <button className="edit-btn-glass" onClick={openProfileModal}>Edit</button>
            </div>
            
            <div className="profile-details-mini">
              <div className="profile-meta-row">
                <div className="mini-item">
                  <label>Program</label>
                  <p>{currentUser?.program || "Not set"}</p>
                </div>
                <div className="mini-item">
                  <label>Year</label>
                  <p>{currentUser?.yearLevel || "Not set"}</p>
                </div>
              </div>
              <div className="mini-item" style={{ marginTop: '12px' }}>
                <label>Skills</label>
                <div className="skills-tags">
                  {(currentUser?.skills || "").split(",").map(s => s.trim()).filter(s => s).map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                  {!(currentUser?.skills) && <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No skills added</span>}
                </div>
              </div>
            </div>

            <div className="completion-row">
              <div style={{ width: "100%" }}>
                <div className="completion-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>Profile Completion</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{profileCompletion}%</strong>
                </div>
                <div className="completion-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div className="completion-fill" style={{ width: `${profileCompletion}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
            </div>
          </section>

          {/* Readiness / Tasks Bento */}
          <section className="bento-card readiness-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Checklist</span>
                <h3>Career Readiness</h3>
              </div>
            </div>
            <div className="readiness-list">
              {readinessChecklist.map((item) => (
                <div key={item.id} className={`readiness-item ${item.done ? 'done' : ''}`}>
                  <div className="check-circle">{item.done ? '✓' : ''}</div>
                  <span className="task-text">{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Market Intelligence Bento */}
          <section className="bento-card trends-bento">
            <JobTrendsWidget />
          </section>

          {/* Applications Bento */}
          <section className="bento-card apps-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Track</span>
                <h3>My Applications</h3>
              </div>
              <div className="app-filters-mini">
                <input
                  type="text"
                  placeholder="Search..."
                  value={applicationSearch}
                  onChange={(e) => setApplicationSearch(e.target.value)}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                </select>
              </div>
            </div>

            <div className="bento-apps-grid">
              {filteredApplications.length === 0 ? (
                <div className="market-status-overlay">
                  <p className="insight-text">No applications found.</p>
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div key={app.id} className="bento-app-card" onClick={() => openApplicationModal(app)}>
                    <div className="app-header-mini">
                      <h4>{app.internship}</h4>
                      <span className={`status-tag ${app.status.toLowerCase()}`}>{app.status}</span>
                    </div>
                    <p className="app-company-mini">{app.company}</p>
                    <div className="app-footer-mini">
                      <span>{new Date(app.dateApplied).toLocaleDateString()}</span>
                      {["PENDING", "REJECTED"].includes(app.status) && (
                        <button onClick={(e) => { e.stopPropagation(); withdrawApplication(app.id); }}>Withdraw</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <h3>Edit Your Profile</h3>
                <button className="close-btn-glass" onClick={closeProfileModal}>✕</button>
              </div>
              <div className="modal-body-pro">
                <form className="form-grid-pro" onSubmit={onSave}>
                  <div className="input-group-pro">
                    <label>Full Name</label>
                    <input name="name" value={form.name} onChange={onChange} required />
                  </div>
                  <div className="input-group-pro">
                    <label>Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} required />
                  </div>
                  <div className="input-group-pro">
                    <label>Program / Course</label>
                    <input name="program" value={form.program} onChange={onChange} />
                  </div>
                  <div className="input-group-pro">
                    <label>Year Level</label>
                    <input name="yearLevel" value={form.yearLevel} onChange={onChange} />
                  </div>
                  <div className="input-group-pro full-width">
                    <label>Skills (comma separated)</label>
                    <textarea 
                      name="skills" 
                      value={form.skills} 
                      onChange={onChange} 
                      placeholder="React, Python, Design..."
                    />
                  </div>
                  <div className="modal-footer-pro full-width">
                    <button className="btn-secondary-glass" type="button" onClick={closeProfileModal}>Cancel</button>
                    <button className="btn-primary-pro" type="submit">Save Profile</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {isApplicationModalOpen && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content application-modal-pro">
            <div className="modal-aurora-glow secondary"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <h3>Application Status</h3>
                <button className="close-btn-glass" onClick={closeApplicationModal}>✕</button>
              </div>
              <div className="modal-body-pro">
                <div className="app-details-grid-pro">
                  <div className="detail-card-mini">
                    <span className="label">Internship</span>
                    <p>{selectedApplication.internship}</p>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Company</span>
                    <p>{selectedApplication.company}</p>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Current Status</span>
                    <span className={`status-tag-v2 ${selectedApplication.status.toLowerCase()}`}>{selectedApplication.status}</span>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Applied On</span>
                    <p>{new Date(selectedApplication.dateApplied).toLocaleDateString()}</p>
                  </div>
                  <div className="detail-card-mini full-width">
                    <span className="label">Applicant Note</span>
                    <div className="note-box-pro">
                      {selectedApplication.studentNote || "No additional notes provided."}
                    </div>
                  </div>
                </div>
                <div className="modal-footer-pro">
                  <button className="btn-secondary-glass" onClick={closeApplicationModal}>Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Updates</span>
                  <h3>Your Notifications</h3>
                </div>
                <button className="close-btn-glass" onClick={() => setIsNotificationsModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body-pro">
                <div className="notif-modal-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty-state">
                      <div className="empty-icon">🔔</div>
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif-item-full ${n.read ? "" : "unread"}`}>
                        <div className="notif-icon-box">
                          {n.title.toLowerCase().includes("accept") ? "🎉" : 
                           n.title.toLowerCase().includes("reject") ? "🤝" : "📩"}
                        </div>
                        <div className="notif-content-full">
                          <h4 className="notif-title-full">{n.title}</h4>
                          <p className="notif-msg-full">{n.message}</p>
                          <span className="notif-time-full">Just now</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer-pro">
                <button className="btn-secondary-glass" onClick={() => setIsNotificationsModalOpen(false)}>Close</button>
                <button className="btn-primary-pro" onClick={fetchNotifications}>Refresh</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
