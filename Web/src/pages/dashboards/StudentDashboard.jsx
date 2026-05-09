import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget"; // ← ADDED
import "../../styles/dashboard.css";

export default function StudentDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const toast = useToast();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
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
        setNotifications(data);
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
        // Map backend DTO to local state format
        const formatted = data.map(app => ({
          id: app.id,
          internship: app.internshipTitle,
          company: app.company,
          location: "See Posting", // In a real app, you might join this data
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
  const acceptedApplications = applications.filter((app) => app.status === "ACCEPTED").length;
  const completedApplications = applications.filter((app) =>
    ["ACCEPTED", "REJECTED", "WITHDRAWN"].includes(app.status)
  ).length;

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

  const clearApplicationFilters = () => {
    setApplicationSearch("");
    setStatusFilter("ALL");
  };

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

  return (
    <DashboardLayout showProfileCard={false}>
      {/* Welcome Hero Section */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <h1>Welcome back, {currentUser?.name?.split(" ")[0] || "Student"}! 👋</h1>
          <p>Your internship journey starts here. Track applications, discover opportunities, and build your career.</p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-icon">📋</span>
              <div>
                <p className="stat-value">{totalApplications}</p>
                <p className="stat-text">Total Applications</p>
              </div>
            </div>
            <div className="hero-stat">
              <span className="stat-icon">⏳</span>
              <div>
                <p className="stat-value">{pendingApplications}</p>
                <p className="stat-text">Pending Review</p>
              </div>
            </div>
            <div className="hero-stat">
              <span className="stat-icon">✅</span>
              <div>
                <p className="stat-value">{acceptedApplications}</p>
                <p className="stat-text">Accepted</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Card */}
      <section className="card profile-card">
        <div className="section-title-row">
          <div>
            <h3>👤 My Profile</h3>
            <p className="section-subtitle">Complete your profile to increase visibility to employers</p>
          </div>
          <button className="action-btn" onClick={openProfileModal}>
            ✏️ Edit Profile
          </button>
        </div>

        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Full Name</span>
            <p className="profile-value">{currentUser?.name || "Not set"}</p>
          </div>
          <div className="profile-item">
            <span className="profile-label">Email</span>
            <p className="profile-value">{currentUser?.email || "Not set"}</p>
          </div>
          <div className="profile-item">
            <span className="profile-label">Program</span>
            <p className="profile-value">{currentUser?.program || "Not set"}</p>
          </div>
          <div className="profile-item">
            <span className="profile-label">Year Level</span>
            <p className="profile-value">{currentUser?.yearLevel || "Not set"}</p>
          </div>
          <div className="profile-item full-width">
            <span className="profile-label">Skills</span>
            <p className="profile-value">{currentUser?.skills || "Not set"}</p>
          </div>
        </div>

        <div className="completion-row">
          <div style={{ width: "100%" }}>
            <div className="completion-info">
              <span>Profile Completion</span>
              <strong>{profileCompletion}%</strong>
            </div>
            <div className="completion-bar">
              <div className="completion-fill" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Application Summary Stats */}
      <section className="card stats-section">
        <h3>📊 Application Summary</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <p className="stat-number">{totalApplications}</p>
            <p className="stat-label">Total Applications</p>
          </div>
          <div className="stat-box">
            <p className="stat-number">{pendingApplications}</p>
            <p className="stat-label">Pending</p>
          </div>
          <div className="stat-box">
            <p className="stat-number">{acceptedApplications}</p>
            <p className="stat-label">Accepted</p>
          </div>
          <div className="stat-box">
            <p className="stat-number">{completedApplications}</p>
            <p className="stat-label">Completed</p>
          </div>
        </div>
      </section>

      {/* ↓↓↓ WORLD BANK JOB TRENDS WIDGET ADDED HERE ↓↓↓ */}
      <JobTrendsWidget />
      {/* ↑↑↑ WORLD BANK JOB TRENDS WIDGET ADDED HERE ↑↑↑ */}

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <section className="card">
          <div className="section-title-row">
            <h3>🔔 Notifications</h3>
            <button className="action-btn small" onClick={fetchNotifications}>Refresh</button>
          </div>
          <div className="student-notification-list">
            {notifications.map((n) => (
              <article key={n.id} className={`student-notification-item ${n.read ? "read" : "unread"}`}>
                <div className="notif-content">
                  <p className="student-notification-title">{n.title}</p>
                  <p className="student-notification-message">{n.message}</p>
                  <span className="feed-muted">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* My Applications */}
      <section className="card applications-card">
        <div className="section-title-row">
          <div>
            <h3>📝 My Applications</h3>
            <p className="section-subtitle">Track and manage all your internship applications</p>
          </div>
          <span className="results-badge">{filteredApplications.length} results</span>
        </div>

        <div className="filter-row">
          <input
            type="text"
            placeholder="Search internship or company..."
            value={applicationSearch}
            onChange={(e) => setApplicationSearch(e.target.value)}
            className="search-input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {(applicationSearch || statusFilter !== "ALL") && (
            <button className="clear-filters-btn" onClick={clearApplicationFilters}>
              Clear
            </button>
          )}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <h4>No applications found</h4>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((app) => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <div className="app-left">
                    <h4 className="internship-title" title={app.internship}>{app.internship}</h4>
                    <p className="company-name">{app.company}</p>
                  </div>
                  <span className={`status ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>

                <div className="application-details">
                  <div className="detail-item"><strong>Location:</strong> {app.location}</div>
                  <div className="detail-item"><strong>Setup:</strong> {app.setup}</div>
                  <div className="detail-item"><strong>Applied:</strong> {new Date(app.dateApplied).toLocaleDateString()}</div>
                </div>

                {app.studentNote && (
                  <div className="application-note">
                    <strong>Note:</strong> {app.studentNote}
                  </div>
                )}

                <div className="application-actions">
                  <button className="action-btn view-btn" onClick={() => openApplicationModal(app)}>
                    View Details
                  </button>
                  {["PENDING", "REJECTED"].includes(app.status) && (
                    <button className="action-link withdraw-btn" onClick={() => withdrawApplication(app.id)}>
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={closeProfileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close-btn" onClick={closeProfileModal}>✕</button>
            </div>
            <form onSubmit={onSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div>
                    <label htmlFor="name">Full Name *</label>
                    <input id="name" name="name" value={form.name} onChange={onChange} required />
                  </div>
                  <div>
                    <label htmlFor="email">Email *</label>
                    <input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
                  </div>
                  <div>
                    <label htmlFor="program">Program</label>
                    <input id="program" name="program" value={form.program} onChange={onChange} />
                  </div>
                  <div>
                    <label htmlFor="yearLevel">Year Level</label>
                    <input id="yearLevel" name="yearLevel" value={form.yearLevel} onChange={onChange} />
                  </div>
                  <div className="full-width">
                    <label htmlFor="skills">Skills</label>
                    <input
                      id="skills"
                      name="skills"
                      value={form.skills}
                      onChange={onChange}
                      placeholder="React, Python, JavaScript, etc."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn-cancel" onClick={closeProfileModal}>Cancel</button>
                <button type="submit" className="modal-btn-submit">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {isApplicationModalOpen && selectedApplication && (
        <div className="modal-overlay" onClick={closeApplicationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="modal-close-btn" onClick={closeApplicationModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="app-details-grid">
                <div><strong>Internship:</strong> {selectedApplication.internship}</div>
                <div><strong>Company:</strong> {selectedApplication.company}</div>
                <div><strong>Location:</strong> {selectedApplication.location}</div>
                <div><strong>Setup:</strong> {selectedApplication.setup}</div>
                <div><strong>Date Applied:</strong> {new Date(selectedApplication.dateApplied).toLocaleDateString()}</div>
                <div><strong>Status:</strong>
                  <span className={`status ${selectedApplication.status.toLowerCase()}`}>
                    {selectedApplication.status}
                  </span>
                </div>
                <div><strong>Student Note:</strong> {selectedApplication.studentNote || "No note added"}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={closeApplicationModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
