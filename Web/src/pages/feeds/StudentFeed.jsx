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
    time: "30 minutes ago",
    details: "Added React, Node.js, and SQL to his profile.",
    type: "PROFILE",
  },
  {
    id: 2,
    student: "Maria Santos",
    program: "BSCS",
    activity: "Applied to Frontend Developer Intern",
    time: "3 hours ago",
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
  const [hiddenPostingIds, setHiddenPostingIds] = useState([]);
  const [studentGoals, setStudentGoals] = useState({
    resume: false,
    portfolio: false,
    interview: false,
    networking: false,
  });
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

  const studentGoalCompletion = Math.round(
    (Object.values(studentGoals).filter(Boolean).length / Object.keys(studentGoals).length) * 100
  );

  const filteredPostings = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    let matches = backendPostings.filter((item) => {
      const searchableText = [item.company, item.title, item.location, item.summary, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (postingFilter === "ALL" || item.setup === postingFilter);
    });

    matches = matches.filter((item) => !hiddenPostingIds.includes(item.id));

    return matches.sort((a, b) => {
      if (sortMode === "APPLICANTS") return b.applicants - a.applicants;
      if (sortMode === "COMPANY") return a.company.localeCompare(b.company);
      return b.id - a.id;
    });
  }, [backendPostings, feedSearch, postingFilter, sortMode, hiddenPostingIds]);

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

  const hidePosting = (posting) => {
    setHiddenPostingIds((prev) => {
      if (prev.includes(posting.id)) return prev;
      showToast(`Hidden ${posting.title} from your feed`);
      return [...prev, posting.id];
    });
  };

  const toggleStudentGoal = (goalKey) => {
    setStudentGoals((prev) => ({
      ...prev,
      [goalKey]: !prev[goalKey],
    }));
  };

  const resetControls = () => {
    setFeedSearch("");
    setPostingFilter("ALL");
    setActivityFilter("ALL");
    setSortMode("RECENT");
  };

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
              <span className="hero-badge">Student Opportunity Hub</span>
              <h1>Find Your Next Career Move</h1>
              <p>Get role-matched internships, monitor your progress, and build momentum in one focused student feed.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{filteredPostings.length}</span>
                <span className="lab">Jobs</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{filteredActivities.length}</span>
                <span className="lab">Updates</span>
              </div>
            </div>
          </div>
        </section>

        <div className="student-bento-grid" style={{ marginBottom: '24px' }}>
            <section className="bento-card apps-bento">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Career Planner</span>
                  <h3>My Momentum</h3>
                </div>
              </div>
...
            </section>

            {/* Market Intelligence in Feed */}
            <section className="bento-card trends-bento" style={{ gridColumn: 'span 4' }}>
               <JobTrendsWidget />
            </section>
        </div>

        <section className="bento-card" style={{ marginBottom: '24px' }}>
          <div className="bento-header">
            <div>
              <span className="bento-label">Filters</span>
              <h3>Feed Controls</h3>
            </div>
            <button type="button" className="edit-btn-glass" onClick={resetControls}>
              Reset
            </button>
          </div>
          <div className="app-filters-mini" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Search anything..."
            />
            <select value={postingFilter} onChange={(e) => setPostingFilter(e.target.value)}>
              <option value="ALL">All Setup</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
            <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
              {Object.entries(ACTIVITY_FILTERS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="RECENT">Recent</option>
              <option value="APPLICANTS">Popular</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>
        </section>

        <div className="feed-grid">
          <section className="bento-card">
            <div className="bento-header">
              <div>
                <span className="bento-label">Opportunities</span>
                <h3>Recommended Internships</h3>
              </div>
              <span className="hero-badge" style={{ margin: 0 }}>{filteredPostings.length} results</span>
            </div>
            
            <div className="postings-grid-pro" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(isLoading && backendPostings.length === 0) ? (
                <div className="market-status-overlay">
                  <div className="loading-pulse"><div className="pulse-dot"></div>Loading...</div>
                </div>
              ) : filteredPostings.length === 0 ? (
                <p className="feed-muted" style={{ textAlign: 'center', padding: '20px' }}>No matches found</p>
              ) : (
                filteredPostings.map((item) => (
                  <div key={item.id} className="feed-card-enhanced">
                    <div className="card-top">
                      <span className="card-tag active">Internship</span>
                      <div className="match-badge">{getMatchScore(item)}% Match</div>
                    </div>
                    <div className="card-body-pro">
                      <span className="company-name">{item.company}</span>
                      <h4>{item.title}</h4>
                      <div className="card-stats-row">
                        <span>📍 {item.location}</span>
                        <span>🏠 {item.setup}</span>
                        <span>📅 {item.time}</span>
                      </div>
                      <p className="job-summary">{item.summary.substring(0, 120)}...</p>
                    </div>
                    <div className="card-actions-pro">
                      <button type="button" className="edit-btn-glass" onClick={() => toggleSavedPosting(item)}>
                        {savedPostingIds.includes(item.id) ? "★ Saved" : "☆ Save"}
                      </button>
                      <button type="button" className="btn-primary-pro" onClick={() => setSelectedPosting(item)}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bento-card">
             <div className="bento-header">
              <div>
                <span className="bento-label">Community</span>
                <h3>Activity Ecosystem</h3>
              </div>
              <span className="hero-badge" style={{ margin: 0 }}>{filteredActivities.length} updates</span>
            </div>

            <div className="postings-grid-pro" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredActivities.length === 0 ? (
                <p className="feed-muted" style={{ textAlign: 'center', padding: '20px' }}>No recent updates</p>
              ) : (
                filteredActivities.map((item) => (
                  <div key={item.id} className="posting-card-pro">
                    <span className="card-tag" style={{ background: 'rgba(57, 198, 184, 0.15)', color: '#39c6b8' }}>Activity</span>
                    <div className="card-body-pro">
                      <span className="loc" style={{ marginBottom: '4px' }}>{item.student} • {item.program}</span>
                      <h4>{item.activity}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px' }}>{item.details}</p>
                    </div>
                    <div className="card-actions-pro">
                      <button type="button" className="edit-btn-glass" onClick={() => showToast(`Followed ${item.student}`)}>Follow</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

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
