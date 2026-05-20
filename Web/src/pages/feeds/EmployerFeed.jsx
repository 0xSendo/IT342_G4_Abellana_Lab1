import { useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget";
import "../../styles/common/feed-base.css";
import "../../styles/employer/employer-feed.css";

export default function EmployerFeed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [allPostings, setAllPostings] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [feedSearch, setFeedSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, MINE, OTHERS
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfileTab, setStudentProfileTab] = useState("essentials");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("NONE");

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

  const fetchConnectionStatus = async (studentId) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get(`/api/connections/status/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionStatus(res.data.status);
    } catch (err) {
      console.error("Failed to fetch connection status", err);
    }
  };

  const sendConnectionRequest = async (studentId) => {
    if (!studentId) {
      toast.show("Error: Invalid Student ID", "error");
      return;
    }
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.post(`/api/connections/request/${studentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.show("Connection request sent!");
      setConnectionStatus("PENDING_SENT");
    } catch (err) {
      console.error("Failed to send connection request", err);
      const errorMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || "Failed to send request";
      toast.show(errorMsg, "error");
    }
  };

  const fetchAllPostings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get("/api/internships/active", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAllPostings(res.data);
    } catch (err) {
      console.error("Failed to fetch postings", err);
      toast.show("Failed to load ecosystem postings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      setIsActivityLoading(true);
      console.log("Employer fetching community posts...");
      const res = await axios.get("/api/community/all");
      console.log("Employer fetched posts:", res.data);
      setCommunityPosts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch community posts", err);
    } finally {
      setIsActivityLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchAllPostings();
    fetchCommunityPosts();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchCommunityPosts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredPostings = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    return allPostings.filter((p) => {
      const matchesSearch = !query || 
        p.title.toLowerCase().includes(query) || 
        p.company.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query);
      
      const isMine = p.postedByEmail === currentUser?.email;
      const matchesFilter = 
        filter === "ALL" || 
        (filter === "MINE" && isMine) || 
        (filter === "OTHERS" && !isMine);

      return matchesSearch && matchesFilter;
    });
  }, [allPostings, feedSearch, filter, currentUser]);

  const stats = useMemo(() => {
    return {
      total: allPostings.length,
      mine: allPostings.filter(p => p.postedByEmail === currentUser?.email).length,
      others: allPostings.filter(p => p.postedByEmail !== currentUser?.email).length,
      updates: communityPosts.length
    };
  }, [allPostings, communityPosts, currentUser]);

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      await axios.put("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`/api/notifications/${notifId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      toast.show("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.show("Failed to delete notification", "error");
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete("/api/notifications/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      toast.show("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      toast.show("Failed to clear notifications", "error");
    }
  };

  const openNotifications = () => {
    setIsNotificationsModalOpen(true);
    markNotificationsAsRead();
  };

  const openStudentProfile = (student) => {
    setSelectedStudent(student);
    setStudentProfileTab("essentials");
    setIsProfileModalOpen(true);
    if (student.studentId) {
      fetchConnectionStatus(student.studentId);
    }
  };

  return (
    <DashboardLayout 
      title="Employer Feed"
      onNotificationClick={openNotifications}
      notificationCount={notifications.filter(n => !n.read).length}
    >
      <div className="employer-feed-wrapper">
        {/* Pro Max Hero Section */}
        <section className="feed-hero">
          <div className="hero-aurora-bg">
            <div className="blob one"></div>
            <div className="blob two"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">Marketplace Intelligence</span>
              <h1>Explore the <span className="gradient-text">Ecosystem</span> 🌐</h1>
              <p>Monitor industry trends, view competitive postings, and discover active student talent in the community.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{stats.total}</span>
                <span className="lab">Active Roles</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{stats.updates}</span>
                <span className="lab">Community Posts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filters Bento */}
        <section className="bento-card filter-bento">
          <div className="feed-controls-pro">
            <div className="search-box-pro">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                placeholder="Search by role, company, or student..."
              />
            </div>
            <div className="filter-group-pro">
              <button 
                className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
                onClick={() => setFilter("ALL")}
              >
                All Postings
              </button>
              <button 
                className={`filter-btn ${filter === "MINE" ? "active" : ""}`}
                onClick={() => setFilter("MINE")}
              >
                My Postings
              </button>
              <button 
                className={`filter-btn ${filter === "OTHERS" ? "active" : ""}`}
                onClick={() => setFilter("OTHERS")}
              >
                Other Employers
              </button>
            </div>
          </div>
        </section>

        {/* Feed Content */}
        <div className="feed-grid-pro-v2" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Postings Grid */}
          <section className="bento-card ecosystem-grid-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Live Marketplace</span>
                <h3>Internship Opportunities</h3>
              </div>
              <button className="btn-refresh-glass" onClick={fetchAllPostings}>Refresh Feed</button>
            </div>

            <div className="ecosystem-postings-grid">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Analyzing ecosystem data...</p>
                </div>
              ) : filteredPostings.length === 0 ? (
                <div className="empty-state-pro">
                  <div className="empty-icon">📂</div>
                  <h4>No postings found</h4>
                  <p>Try adjusting your search or filters to see more results.</p>
                </div>
              ) : (
                filteredPostings.map((posting) => {
                  const isMine = posting.postedByEmail === currentUser?.email;
                  return (
                    <div key={posting.id} className={`ecosystem-card ${isMine ? "is-mine" : ""}`}>
                      <div className="card-top">
                        <div className="company-logo-placeholder">
                          {posting.company?.charAt(0) || "C"}
                        </div>
                        {isMine && <span className="mine-badge">Your Post</span>}
                      </div>
                      
                      <div className="card-info">
                        <h4>{posting.title}</h4>
                        <p className="company-name">{posting.company}</p>
                        <div className="meta-info">
                          <span>📍 {posting.location}</span>
                          <span>💻 {posting.setup}</span>
                        </div>
                      </div>

                      <div className="card-description">
                        <p>{posting.description?.substring(0, 100)}...</p>
                      </div>

                      <div className="card-footer-pro">
                        <span className="post-date">Posted on {formatDate(posting.startDate)}</span>
                        <button 
                          className={`btn-action-pro ${isMine ? "primary" : "secondary"}`}
                          onClick={() => toast.show(isMine ? "Navigate to Dashboard to edit" : "Competitive viewing enabled")}
                        >
                          {isMine ? "Manage Posting" : "View Details"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Intelligence & Community Column */}
          <div className="feed-side-col" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <section className="bento-card trends-bento">
              <JobTrendsWidget />
            </section>

            <section className="bento-card community-activity-bento">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Active Talent</span>
                  <h3>Community Activity</h3>
                </div>
                <button className="btn-refresh-glass" style={{ padding: '4px' }} onClick={fetchCommunityPosts}>🔄</button>
              </div>
              
              <div className="activity-list-pro" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                {isActivityLoading ? (
                  <div className="loading-pulse" style={{ textAlign: 'center', padding: '2rem' }}>Analyzing community...</div>
                ) : communityPosts.length === 0 ? (
                  <div className="empty-state-pro" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p className="insight-text">No community activity yet.</p>
                  </div>
                ) : (
                  communityPosts.map((item) => (
                    <div key={item.id} className="posting-card-pro" style={{ padding: '1.25rem', borderLeft: item.type === 'PROFILE_SHARE' ? '3px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="activity-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="loc" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.studentName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.studentProgram}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '10px 0 0', lineHeight: 1.5 }}>{item.content}</p>
                      {item.type === 'PROFILE_SHARE' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>🚀 STUDENT PROFILE SHARED</span>
                          <button className="edit-btn-glass" style={{ fontSize: '0.7rem', padding: '4px 10px' }} onClick={() => openStudentProfile(item)}>View Profile</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Student Profile Modal (Read Only for Employer) */}
      {isProfileModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Talent Profile</span>
                  <h3>{selectedStudent.studentName}</h3>
                </div>
                <div className="modal-tabs-pro" style={{ width: 'auto', flex: 'none', marginLeft: 'auto', marginRight: '2rem' }}>
                  <button 
                    className={`modal-tab-btn ${studentProfileTab === 'essentials' ? 'active' : ''}`}
                    onClick={() => setStudentProfileTab('essentials')}
                  >
                    <span>🔑 Info</span>
                  </button>
                  <button 
                    className={`modal-tab-btn ${studentProfileTab === 'portfolio' ? 'active' : ''}`}
                    onClick={() => setStudentProfileTab('portfolio')}
                  >
                    <span>🚀 Portfolio</span>
                  </button>
                </div>
                <button className="close-btn-glass" onClick={() => setIsProfileModalOpen(false)}>✕</button>
              </div>
              
              <div className="modal-body-pro" style={{ minHeight: '300px' }}>
                {studentProfileTab === 'essentials' && (
                  <div className="profile-details-mini" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <div className="profile-meta-row" style={{ display: 'flex', gap: '30px', marginBottom: '24px' }}>
                      <div className="mini-item">
                        <label>Program / Course</label>
                        <p style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{selectedStudent.studentProgram}</p>
                      </div>
                      <div className="mini-item">
                        <label>Year Level</label>
                        <p style={{ fontSize: '1.2rem' }}>{selectedStudent.studentYearLevel || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="mini-item">
                      <label>Contact Interest</label>
                      <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>Available for internship inquiries</p>
                    </div>

                    {selectedStudent.studentResumeUrl && (
                      <div className="mini-item" style={{ marginTop: '24px' }}>
                        <label>Professional Resume</label>
                        <a 
                          href={selectedStudent.studentResumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="skill-tag"
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            textDecoration: 'none', 
                            background: 'rgba(57, 198, 184, 0.1)', 
                            color: '#39c6b8', 
                            border: '1px solid rgba(57, 198, 184, 0.2)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            marginTop: '10px'
                          }}
                        >
                          📄 View Student Resume (PDF)
                        </a>
                      </div>
                    )}

                    <div className="mini-item" style={{ marginTop: '24px' }}>
                      <label>Technical Skills & Expertise</label>
                      <div className="skills-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                        {(selectedStudent.studentSkills || "").split(",").map(s => s.trim()).filter(s => s).length > 0 ? (
                          (selectedStudent.studentSkills || "").split(",").map(s => s.trim()).filter(s => s).map((skill, i) => (
                            <span key={i} className="skill-tag" style={{ background: 'rgba(255,107,74,0.1)', color: 'var(--primary)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,107,74,0.2)' }}>{skill}</span>
                          ))
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>No specific skills listed yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {studentProfileTab === 'portfolio' && (
                  <div className="profile-details-mini" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <div className="mini-item">
                      <label>Professional Bio</label>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', opacity: 0.9, margin: 0 }}>
                          {selectedStudent.studentBio || "This student hasn't added a professional bio yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mini-item" style={{ marginTop: '24px' }}>
                      <label>Featured Projects & Accomplishments</label>
                      <div style={{ background: 'rgba(57, 198, 184, 0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(57, 198, 184, 0.1)', marginTop: '10px' }}>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', opacity: 0.9, margin: 0 }}>
                          {selectedStudent.studentProjects || "No featured projects documented at this time."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer-pro" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px' }}>
                <button className="btn-secondary-glass" onClick={() => setIsProfileModalOpen(false)}>Back to Feed</button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  {connectionStatus === "NONE" && (
                    <button className="btn-primary-pro" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => sendConnectionRequest(selectedStudent.studentId)}>
                      ➕ Connect with Student
                    </button>
                  )}
                  {connectionStatus === "PENDING_SENT" && (
                    <button className="btn-secondary-glass" disabled style={{ opacity: 0.6 }}>
                      ⏳ Request Sent
                    </button>
                  )}
                  {connectionStatus === "PENDING_RECEIVED" && (
                    <button className="btn-primary-pro" style={{ background: '#39c6b8' }} onClick={() => toast.show("Please respond to request in your dashboard!")}>
                      📩 Review Request
                    </button>
                  )}
                  {connectionStatus === "ACCEPTED" && (
                    <button className="btn-secondary-glass" disabled style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                      🤝 Connected
                    </button>
                  )}
                  <button className="btn-secondary-glass" style={{ borderColor: 'rgba(57, 198, 184, 0.3)', color: '#39c6b8' }} onClick={() => toast.show("Bookmark feature coming soon!")}>🔖 Save Profile</button>
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
                  <h3>Company Notifications</h3>
                </div>
                {notifications.length > 0 && (
                  <button 
                    className="btn-secondary-glass" 
                    style={{ marginLeft: 'auto', marginRight: '1rem', color: '#ff6b6b', borderColor: 'rgba(255,107,74,0.2)' }}
                    onClick={clearAllNotifications}
                  >
                    Clear All
                  </button>
                )}
                <button className="close-btn-glass" onClick={() => setIsNotificationsModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body-pro">
                <div className="notif-modal-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty-state">
                      <div className="empty-icon">🔔</div>
                      <p>No new activity yet.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif-item-full ${n.read ? "" : "unread"}`} style={{ position: 'relative' }}>
                        <div className="notif-icon-box">
                          {n.type === "APPLICATION" ? "📩" : "🔔"}
                        </div>
                        <div className="notif-content-full">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 className="notif-title-full">{n.title}</h4>
                            <button 
                              onClick={() => deleteNotification(n.id)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--muted)', 
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '1rem',
                                opacity: 0.6
                              }}
                              title="Delete notification"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="notif-msg-full">{n.message}</p>
                          <span className="notif-time-full">
                            {formatDateTime(n.createdAt)}
                          </span>
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
