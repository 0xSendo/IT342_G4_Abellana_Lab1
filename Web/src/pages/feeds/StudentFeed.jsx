import { useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget";
import "../../styles/common/bento.css";
import "../../styles/common/feed-base.css";
import "../../styles/student/student-dashboard.css";
import "../../styles/student/student-feed.css";
import "../../styles/notifications.css";

const STUDENT_ACTIVITY_FEED = [
  {
    id: 1,
    student: "Juan Dela Cruz",
    program: "BSIT",
    activity: "Updated skills and portfolio",
    time: "30 min ago",
    details: "Added React, Node.js, and SQL to his profile.",
    type: "PROFILE",
  },
  {
    id: 2,
    student: "Maria Santos",
    program: "BSCS",
    activity: "Applied to Frontend Developer Intern",
    time: "3 hrs ago",
    details: "Currently shortlisted for technical interview.",
    type: "APPLICATION",
  },
  {
    id: 3,
    student: "Alyssa Tan",
    program: "BSIT",
    activity: "Completed profile verification",
    time: "1 day ago",
    details: "Ready for employer review and recruitment.",
    type: "VERIFICATION",
  },
];

const ACTIVITY_FILTERS = {
  ALL: "All Activity",
  PROFILE: "Profile Updates",
  APPLICATION: "Applications",
  VERIFICATION: "Verification",
};

export default function StudentFeed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [backendPostings, setBackendPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedSearch, setFeedSearch] = useState("");
  const [postingFilter, setPostingFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("RECENT");
  const [savedPostingIds, setSavedPostingIds] = useState([]);
  const [appliedPostingIds, setAppliedPostingIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchPostings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get("/api/internships/active", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const formatted = res.data.map(item => ({
        id: item.id,
        company: item.company || "Unknown Company",
        title: item.title || "Untitled Role",
        location: item.location || "PH",
        setup: item.setup || "Onsite",
        time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently",
        summary: item.description || "No description provided.",
        deadline: item.endDate || "N/A",
        applicants: item.applicantsList?.length || 0,
        tags: [item.setup || "Internship", "Active"],
      }));
      setBackendPostings(formatted);
    } catch (err) {
      console.error("Failed to fetch postings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchPostings();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const studentSkills = useMemo(() => {
    const raw = String(currentUser?.skills || "").trim();
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }, [currentUser?.skills]);

  const filteredPostings = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    let matches = backendPostings.filter((item) => {
      const searchableText = [item.company, item.title, item.location, item.summary, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (postingFilter === "ALL" || item.setup === postingFilter);
    });

    return matches.sort((a, b) => {
      if (sortMode === "APPLICANTS") return b.applicants - a.applicants;
      if (sortMode === "COMPANY") return a.company.localeCompare(b.company);
      return b.id - a.id;
    });
  }, [backendPostings, feedSearch, postingFilter, sortMode]);

  const filteredActivities = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    return STUDENT_ACTIVITY_FEED.filter((item) => {
      const searchableText = [item.student, item.program, item.activity, item.details, item.type]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (activityFilter === "ALL" || item.type === activityFilter);
    });
  }, [feedSearch, activityFilter]);

  const getMatchScore = (posting) => {
    if (!studentSkills.length) return 72;
    const postingTags = (posting.tags || []).map((tag) => String(tag).toLowerCase());
    const overlaps = studentSkills.filter((skill) => postingTags.some((tag) => tag.includes(skill) || skill.includes(tag))).length;
    return Math.min(98, 62 + overlaps * 12);
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      await axios.put(`${API_BASE}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const openNotifications = () => {
    setIsNotificationsModalOpen(true);
    markNotificationsAsRead();
  };

  const showToast = (message) => toast.show(message);

  const toggleSavedPosting = (posting) => {
    setSavedPostingIds((prev) => {
      const isSaved = prev.includes(posting.id);
      showToast(isSaved ? "Removed from saved posts" : "Saved for later review");
      return isSaved ? prev.filter((id) => id !== posting.id) : [...prev, posting.id];
    });
  };

  const applyToPosting = async (posting) => {
    if (appliedPostingIds.includes(posting.id)) {
      showToast(`You already applied to ${posting.title}`);
      return;
    }

    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.post(`/api/applications/apply/${posting.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppliedPostingIds((prev) => [...prev, posting.id]);
      showToast(`Application submitted to ${posting.title}`);
      setSelectedPosting(null);
    } catch (err) {
      console.error("Application error", err);
      const msg = err.response?.data?.message || "Failed to submit application";
      showToast(msg, "error");
    }
  };

  const resetControls = () => {
    setFeedSearch("");
    setPostingFilter("ALL");
    setActivityFilter("ALL");
    setSortMode("RECENT");
  };

  return (
    <DashboardLayout 
      title="Opportunity Feed"
      onNotificationClick={openNotifications}
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
              <span className="hero-badge">Student Opportunity Hub</span>
              <h1>Explore the <span className="gradient-text">Future</span> 🌐</h1>
              <p>Discover roles tailored to your skills, track ecosystem activity, and monitor market trends in one focused feed.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{filteredPostings.length}</span>
                <span className="lab">Open Roles</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{filteredActivities.length}</span>
                <span className="lab">New Updates</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pro Max Layout: Filters and Quick Tips */}
        <div className="feed-controls-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <section className="bento-card">
            <div className="bento-header">
              <div>
                <span className="bento-label">Filters</span>
                <h3>Targeted Search</h3>
              </div>
              <button type="button" className="edit-btn-glass" onClick={resetControls}>Reset</button>
            </div>
            <div className="app-filters-mini" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px', marginTop: '1rem' }}>
              <input
                type="text"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                placeholder="Search by role, company, or skills..."
              />
              <select value={postingFilter} onChange={(e) => setPostingFilter(e.target.value)}>
                <option value="ALL">All Setups</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                <option value="RECENT">Newest First</option>
                <option value="APPLICANTS">Most Popular</option>
                <option value="COMPANY">A-Z Company</option>
              </select>
            </div>
          </section>

          <section className="bento-card pro-tips-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Pro Tip</span>
                <h3>Boost Visibility</h3>
              </div>
            </div>
            <div className="tip-content">
              <p>Students with <strong>5+ verified skills</strong> are 3x more likely to be shortlisted by top employers.</p>
              <a href="/dashboard" className="tip-link">Update Profile →</a>
            </div>
          </section>
        </div>

        {/* Balanced Grid for Content and Intelligence */}
        <div className="feed-grid-pro-v2" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr', gap: '2rem' }}>
          {/* Main Opportunities Column */}
          <div className="feed-main-col">
            <section className="bento-card">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Recommendations</span>
                  <h3>Matched For You</h3>
                </div>
                <span className="hero-badge" style={{ margin: 0 }}>{filteredPostings.length} Matches</span>
              </div>
              
              <div className="postings-grid-pro" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                {(isLoading && backendPostings.length === 0) ? (
                  <div className="market-status-overlay">
                    <div className="loading-pulse"><div className="pulse-dot"></div>Analyzing ecosystem...</div>
                  </div>
                ) : filteredPostings.length === 0 ? (
                  <div className="empty-state-pro" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="empty-icon">🔍</div>
                    <h4>No exact matches</h4>
                    <p>Try widening your filters to see more opportunities.</p>
                  </div>
                ) : (
                  filteredPostings.map((item) => (
                    <div key={item.id} className="feed-card-enhanced">
                      <div className="card-top">
                        <span className="card-tag active">{item.setup}</span>
                        <div className="match-badge">{getMatchScore(item)}% Match</div>
                      </div>
                      <div className="card-body-pro">
                        <span className="company-name">{item.company}</span>
                        <h4>{item.title}</h4>
                        <div className="card-stats-row">
                          <span>📍 {item.location}</span>
                          <span>📅 {item.time}</span>
                          <span>👥 {item.applicants} Apps</span>
                        </div>
                        <p className="job-summary">{item.summary.substring(0, 140)}...</p>
                      </div>
                      <div className="card-actions-pro">
                        <button type="button" className="edit-btn-glass" onClick={() => toggleSavedPosting(item)}>
                          {savedPostingIds.includes(item.id) ? "★ Saved" : "☆ Save"}
                        </button>
                        <button type="button" className="btn-primary-pro" onClick={() => setSelectedPosting(item)}>
                          View & Apply
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Intelligence & Activity Column */}
          <div className="feed-side-col" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section className="bento-card trends-bento">
              <JobTrendsWidget />
            </section>

            <section className="bento-card activity-bento">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Live Feed</span>
                  <h3>Community Activity</h3>
                </div>
              </div>
              <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {filteredActivities.map((item) => (
                  <div key={item.id} className="posting-card-pro" style={{ padding: '1rem' }}>
                    <div className="activity-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="loc" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.student}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{item.time}</span>
                    </div>
                    <h5 style={{ fontSize: '0.9rem', margin: '6px 0', fontWeight: 700 }}>{item.activity}</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>{item.details.substring(0, 40)}...</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Selected Posting Modal */}
      {selectedPosting && (
        <div className="modal-overlay">
          <div className="modal-content application-modal-pro">
            <div className="modal-aurora-glow secondary"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <h3>Internship Details</h3>
                <button className="close-btn-glass" onClick={() => setSelectedPosting(null)}>✕</button>
              </div>
              <div className="modal-body-pro">
                <div className="app-details-grid-pro">
                  <div className="detail-card-mini">
                    <span className="label">Company</span>
                    <p>{selectedPosting.company}</p>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Role</span>
                    <p>{selectedPosting.title}</p>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Location</span>
                    <p>{selectedPosting.location}</p>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Setup</span>
                    <p>{selectedPosting.setup}</p>
                  </div>
                  <div className="detail-card-mini full-width">
                    <span className="label">Description</span>
                    <div className="note-box-pro">
                      {selectedPosting.summary}
                    </div>
                  </div>
                </div>
                <div className="modal-footer-pro full-width">
                   <button type="button" className="btn-secondary-glass" onClick={() => toggleSavedPosting(selectedPosting)}>
                    {savedPostingIds.includes(selectedPosting.id) ? "★ Saved" : "☆ Save"}
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary-pro" 
                    onClick={() => applyToPosting(selectedPosting)}
                    disabled={appliedPostingIds.includes(selectedPosting.id)}
                  >
                    {appliedPostingIds.includes(selectedPosting.id) ? "Applied" : "Confirm Application"}
                  </button>
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
                          <span className="notif-time-full">{new Date(n.createdAt).toLocaleString()}</span>
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
