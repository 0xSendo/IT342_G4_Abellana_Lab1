import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget"; 
import "../../styles/common/bento.css";
import "../../styles/student/student-dashboard.css";
import "../../styles/notifications.css";

export default function StudentDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const { openChatWith } = useChat();
  const toast = useToast();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("essentials"); // "essentials" or "portfolio"
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  const openProfileBuilder = () => {
    navigate("/profile/build");
  };

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    program: currentUser?.program || "",
    yearLevel: currentUser?.yearLevel || "",
    skills: currentUser?.skills || "",
    bio: currentUser?.bio || "",
    projects: currentUser?.projects || "",
    resumeUrl: currentUser?.resumeUrl || "",
    linkedin: currentUser?.linkedin || "",
    website: currentUser?.website || "",
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchConnectionsData = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      
      const [pendingRes, friendsRes] = await Promise.all([
        fetch(`${API_BASE}/api/connections/pending`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/connections/friends`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (pendingRes.ok) setPendingRequests(await pendingRes.json());
      if (friendsRes.ok) setFriends(await friendsRes.json());
    } catch (err) {
      console.error("Failed to fetch connections", err);
    }
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await fetch(`${API_BASE}/api/connections/respond/${connectionId}?status=${status}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.show(`Request ${status === 'ACCEPTED' ? 'accepted' : 'declined'}`);
        fetchConnectionsData();
      }
    } catch (err) {
      console.error("Failed to respond to request", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
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
    fetchConnectionsData();
    const interval = setInterval(() => {
      fetchConnectionsData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data only once
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (currentUser && !isInitialized) {
      setForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        program: currentUser.program || "",
        yearLevel: currentUser.yearLevel || "",
        skills: currentUser.skills || "",
        bio: currentUser.bio || "",
        projects: currentUser.projects || "",
        resumeUrl: currentUser.resumeUrl || "",
        linkedin: currentUser.linkedin || "",
        website: currentUser.website || "",
      });
      setIsInitialized(true);
    }
  }, [currentUser, isInitialized]);

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
  currentUser?.bio,
  currentUser?.projects,
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
      const msg = res.message || "Update failed";
      if (msg.includes("MODERATION_ERROR")) {
        toast.show(msg.replace("MODERATION_ERROR: ", ""), "warning");
      } else {
        toast.show(msg, "error");
      }
    }
  };

  const readinessChecklist = [
    { id: 'info', text: 'Basic Information', done: !!(currentUser?.name && currentUser?.program && currentUser?.yearLevel) },
    { id: 'skills', text: 'Add Skills & Expertise', done: !!(currentUser?.skills?.trim()) },
    { id: 'app', text: 'First Application Sent', done: totalApplications > 0 }
  ];

  return (
    <DashboardLayout showProfileCard={false}>
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
                <span className="bento-label">Your Identity</span>
                <h3>{currentUser?.name}</h3>
              </div>
              <button className="edit-btn-glass" onClick={openProfileBuilder}>Edit</button>
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

              {currentUser?.bio && (
                <div className="mini-item" style={{ marginTop: '12px' }}>
                  <label>Bio</label>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8, lineHeight: 1.4 }}>{currentUser.bio}</p>
                </div>
              )}

              <div className="mini-item" style={{ marginTop: '12px' }}>
                <label>Skills & Expertise</label>
                <div className="skills-tags">
                  {(currentUser?.skills || "").split(",").map(s => s.trim()).filter(s => s).map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                  {!(currentUser?.skills) && <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No skills added</span>}
                </div>
              </div>

              {currentUser?.projects && (
                <div className="mini-item" style={{ marginTop: '12px' }}>
                  <label>Featured Projects</label>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8, lineHeight: 1.4 }}>{currentUser.projects}</p>
                </div>
              )}

              {currentUser?.resumeUrl && (
                <div className="mini-item" style={{ marginTop: '12px' }}>
                  <a 
                    href={currentUser.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="skill-tag"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(57, 198, 184, 0.1)', color: '#39c6b8', border: '1px solid rgba(57, 198, 184, 0.2)' }}
                  >
                    📄 View Professional Resume
                  </a>
                </div>
              )}
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

          {/* Connections Bento */}
          <section className="bento-card connections-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Networking</span>
                <h3>My Connections</h3>
              </div>
              <button className="edit-btn-glass" onClick={() => setIsFriendsModalOpen(true)}>View All ({friends.length})</button>
            </div>
            
            <div className="pending-requests-section" style={{ marginTop: '1rem' }}>
              {pendingRequests.length > 0 && (
                <div className="pending-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>PENDING REQUESTS</span>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="request-card-mini">
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{req.requesterName}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>{req.requesterRole}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => respondToRequest(req.id, 'ACCEPTED')} style={{ background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>Accept</button>
                        <button onClick={() => respondToRequest(req.id, 'DECLINED')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="friends-preview" style={{ marginTop: pendingRequests.length > 0 ? '1.5rem' : '0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px' }}>RECENT CONNECTIONS</span>
                <div className="friends-avatars" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {friends.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>No connections yet. Connect with employers to grow your network!</p>
                  ) : (
                    friends.slice(0, 5).map(friend => (
                      <div key={friend.id} className="friend-avatar-circle" title={friend.name} style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.1)' }}>
                        {friend.name.charAt(0)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
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
                      <h4 style={{ fontSize: '0.95rem' }}>{app.internship}</h4>
                      <span className={`status-tag ${app.status.toLowerCase()}`}>{app.status}</span>
                    </div>
                    <p className="app-company-mini" style={{ fontSize: '0.85rem' }}>{app.company}</p>
                    <div className="app-footer-mini">
                      <span style={{ fontSize: '0.75rem' }}>{new Date(app.dateApplied).toLocaleDateString()}</span>
                      {["PENDING", "REJECTED"].includes(app.status) && (
                        <button style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); withdrawApplication(app.id); }}>Withdraw</button>
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
            <div className="modal-aurora-glow secondary"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Profile Management</span>
                  <h3>Edit Your Identity</h3>
                </div>
                <div className="modal-tabs-pro" style={{ width: 'auto', flex: 'none', marginLeft: 'auto', marginRight: '2rem' }}>
                  <button 
                    className={`modal-tab-btn ${profileTab === 'essentials' ? 'active' : ''}`}
                    onClick={() => setProfileTab('essentials')}
                  >
                    <span>🔑 Essentials</span>
                  </button>
                  <button 
                    className={`modal-tab-btn ${profileTab === 'portfolio' ? 'active' : ''}`}
                    onClick={() => setProfileTab('portfolio')}
                  >
                    <span>🚀 Portfolio</span>
                  </button>
                </div>
                <button className="close-btn-glass" onClick={closeProfileModal}>✕</button>
              </div>
              <div className="modal-body-pro" style={{ minHeight: '400px' }}>
                <form className="form-grid-pro" onSubmit={onSave}>
                  {profileTab === 'essentials' && (
                    <div style={{ display: 'contents', animation: 'fadeUp 0.4s ease-out' }}>
                      <div className="input-group-pro">
                        <label>Full Name</label>
                        <input name="name" value={form.name} onChange={onChange} required placeholder="Enter your full name" />
                      </div>
                      <div className="input-group-pro">
                        <label>Email Address</label>
                        <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="your@email.com" />
                      </div>
                      <div className="input-group-pro">
                        <label>Program / Course</label>
                        <input name="program" value={form.program} onChange={onChange} placeholder="e.g. BS Information Technology" />
                      </div>
                      <div className="input-group-pro">
                        <label>Year Level</label>
                        <input name="yearLevel" value={form.yearLevel} onChange={onChange} placeholder="e.g. 3rd Year" />
                      </div>
                      <div className="input-group-pro full-width">
                        <label>Skills & Expertise (comma separated)</label>
                        <textarea 
                          name="skills" 
                          value={form.skills} 
                          onChange={onChange} 
                          placeholder="React, Python, UI Design, Project Management..."
                          rows={3}
                          style={{ minHeight: '100px' }}
                        />
                      </div>
                    </div>
                  )}

                  {profileTab === 'portfolio' && (
                    <div style={{ display: 'contents', animation: 'fadeUp 0.4s ease-out' }}>
                      <div className="input-group-pro full-width">
                        <label>Professional Bio <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>(Optional)</span></label>
                        <textarea 
                          name="bio" 
                          value={form.bio} 
                          onChange={onChange} 
                          placeholder="Briefly describe yourself, your career goals, and what makes you a unique candidate..."
                          rows={5}
                          style={{ minHeight: '150px' }}
                        />
                      </div>
                      <div className="input-group-pro full-width">
                        <label>Projects & Portfolios <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>(Optional)</span></label>
                        <textarea 
                          name="projects" 
                          value={form.projects} 
                          onChange={onChange} 
                          placeholder="Highlight key academic or personal projects. Include links if available..."
                          rows={5}
                          style={{ minHeight: '150px' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="modal-footer-pro full-width" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                    <button className="btn-secondary-glass" type="button" onClick={closeProfileModal}>Cancel</button>
                    <button className="btn-primary-pro" type="submit" style={{ padding: '12px 40px' }}>Save Changes</button>
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

      {/* Friends Modal */}
      {isFriendsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Network</span>
                  <h3>Your Connections</h3>
                </div>
                <button className="close-btn-glass" onClick={() => setIsFriendsModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body-pro">
                <div className="friends-list-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {friends.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: 'var(--muted)' }}>No connections found.</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div key={friend.id} className="friend-card-pro" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                          {friend.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem' }}>{friend.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{friend.role}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{friend.companyName || friend.program}</p>
                        </div>
                        <button 
                          className="btn-primary-pro" 
                          style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                          onClick={() => {
                            openChatWith(friend);
                            setIsFriendsModalOpen(false);
                          }}
                        >
                          Chat
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer-pro">
                <button className="btn-secondary-glass" onClick={() => setIsFriendsModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
