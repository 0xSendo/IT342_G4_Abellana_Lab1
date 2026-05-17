import { useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/feed.css";

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
  {
    id: 4,
    student: "Jasper Lim",
    program: "BSIT",
    activity: "Joined internship talent pool",
    time: "2 days ago",
    details: "Open to frontend, QA, and support opportunities.",
    type: "PROFILE",
  },
];

const ACTIVITY_FILTERS = {
  ALL: "All Activity",
  PROFILE: "Profile Updates",
  APPLICATION: "Applications",
  VERIFICATION: "Verification",
};

const INITIAL_STUDENT_NOTIFICATIONS = [
  {
    id: 1,
    type: "APPLICATION",
    title: "Application reminder",
    message: "Check your pending applications for any updates.",
    time: "10 minutes ago",
    read: false,
  },
  {
    id: 2,
    type: "MATCH",
    title: "Career Tip",
    message: "Keep your skills updated to get better role matches.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "CHECKLIST",
    title: "Career checklist tip",
    message: "Complete interview prep to increase shortlist chances.",
    time: "Today",
    read: true,
  },
];

export default function Feed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();
  const role = currentUser?.role || "STUDENT";
  const isStudentView = role === "STUDENT";

  const [backendPostings, setBackendPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedSearch, setFeedSearch] = useState("");
  const [postingFilter, setPostingFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("RECENT");
  const [savedPostingIds, setSavedPostingIds] = useState([]);
  const [appliedPostingIds, setAppliedPostingIds] = useState([]);
  const [hiddenPostingIds, setHiddenPostingIds] = useState([]);
  const [studentTab, setStudentTab] = useState("DISCOVER");
  const [studentAlertSetup, setStudentAlertSetup] = useState("ALL");
  const [studentGoals, setStudentGoals] = useState({
    resume: false,
    portfolio: false,
    interview: false,
    networking: false,
  });
  const [studentNotifications, setStudentNotifications] = useState([]);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(!document.body.classList.contains("light-theme"));

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  // Fetch real internships from backend
  const fetchPostings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get("/api/internships/active", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      console.log("Feed data received:", res.data);
      
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
      console.error("Failed to fetch postings:", err.response || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const formatted = res.data.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleString(),
        read: n.read,
        relatedId: n.relatedId
      }));
      setStudentNotifications(formatted);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchPostings();
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme with body class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const studentSkills = useMemo(() => {
    const raw = String(currentUser?.skills || "").trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean);
  }, [currentUser?.skills]);

  const studentGoalCompletion = Math.round(
    (Object.values(studentGoals).filter(Boolean).length / Object.keys(studentGoals).length) * 100
  );

  const unreadStudentNotifications = studentNotifications.filter((item) => !item.read).length;

  const filteredPostings = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    
    let matches = backendPostings.filter((item) => {
      const searchableText = [item.company, item.title, item.location, item.summary, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (postingFilter === "ALL" || item.setup === postingFilter);
    });

    if (isStudentView) {
      matches = matches.filter((item) => !hiddenPostingIds.includes(item.id));

      if (studentAlertSetup !== "ALL") {
        matches = matches.filter((item) => item.setup === studentAlertSetup);
      }

      if (studentTab === "SAVED") {
        matches = matches.filter((item) => savedPostingIds.includes(item.id));
      }

      if (studentTab === "APPLIED") {
        matches = matches.filter((item) => appliedPostingIds.includes(item.id));
      }
    }

    return [...matches].sort((a, b) => {
      if (sortMode === "APPLICANTS") return b.applicants - a.applicants;
      if (sortMode === "COMPANY") return a.company.localeCompare(b.company);
      return b.id - a.id;
    });
  }, [
    backendPostings,
    feedSearch,
    postingFilter,
    sortMode,
    isStudentView,
    hiddenPostingIds,
    studentAlertSetup,
    studentTab,
    savedPostingIds,
    appliedPostingIds,
  ]);

  const filteredActivities = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();

    return STUDENT_ACTIVITY_FEED.filter((item) => {
      const searchableText = [item.student, item.program, item.activity, item.details, item.type]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (activityFilter === "ALL" || item.type === activityFilter);
    });
  }, [feedSearch, activityFilter]);

  const savedPostings = backendPostings.filter((item) => savedPostingIds.includes(item.id));

  const showToast = (message) => toast.show(message);

  const getMatchScore = (posting) => {
    if (!studentSkills.length) return 72;
    const postingTags = (posting.tags || []).map((tag) => String(tag).toLowerCase());
    const overlaps = studentSkills.filter((skill) => postingTags.some((tag) => tag.includes(skill) || skill.includes(tag))).length;
    return Math.min(98, 62 + overlaps * 12);
  };

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
      const res = await axios.post(`/api/applications/apply/${posting.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppliedPostingIds((prev) => [...prev, posting.id]);
      showToast(`Application submitted to ${posting.title}`);
      closePostingDetails();
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

  const markNotificationRead = (notificationId) => {
    setStudentNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    );
  };

  const dismissNotification = (notificationId) => {
    setStudentNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  };

  const markAllNotificationsRead = () => {
    setStudentNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    showToast("All notifications marked as read");
  };

  const openNotificationContext = (notification) => {
    if (notification.relatedPostingId) {
      const posting = backendPostings.find((item) => item.id === notification.relatedPostingId);
      if (posting) {
        setSelectedPosting(posting);
        markNotificationRead(notification.id);
        return;
      }
    }
    markNotificationRead(notification.id);
    showToast("Notification opened");
  };

  const openPostingDetails = (posting) => {
    setSelectedPosting(posting);
  };

  const closePostingDetails = () => {
    setSelectedPosting(null);
  };

  const handlePrimaryPostingAction = (posting) => {
    // Always open details modal for both students and employers
    openPostingDetails(posting);
  };

  const resetControls = () => {
    setFeedSearch("");
    setPostingFilter("ALL");
    setActivityFilter("ALL");
    setSortMode("RECENT");
    if (isStudentView) {
      setStudentTab("DISCOVER");
      setStudentAlertSetup("ALL");
    }
  };

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
              <span className="hero-badge">{isStudentView ? "Student Opportunity Hub" : "Community Feed"}</span>
              <h1>{isStudentView ? "Find Your Next Career Move" : "Ecosystem Activity"}</h1>
              <p>
                {role === "EMPLOYER"
                  ? "See which students are active, explore postings, and review talent in one place."
                  : "Get role-matched internships, monitor your progress, and build momentum in one focused student feed."}
              </p>
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

        {isStudentView && (
          <div className="student-bento-grid" style={{ marginBottom: '24px' }}>
            <section className="bento-card notifications-bento">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Updates</span>
                  <h3>Notifications</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="student-notification-badge" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{unreadStudentNotifications} NEW</span>
                  <button type="button" className="refresh-btn-glass" onClick={markAllNotificationsRead}>✓</button>
                </div>
              </div>

              <div className="notif-scroll-area">
                {studentNotifications.length === 0 && (
                  <p className="feed-muted" style={{ textAlign: 'center', padding: '20px' }}>No new updates</p>
                )}
                {studentNotifications.slice(0, 4).map((item) => (
                  <div key={item.id} className={`notif-item-mini ${item.read ? "read" : "unread"}`}>
                    <div className="notif-indicator"></div>
                    <div className="notif-info">
                      <p className="notif-t">{item.title}</p>
                      <p className="notif-d">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bento-card apps-bento">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Career Planner</span>
                  <h3>My Momentum</h3>
                </div>
              </div>

              <div className="stats-mini-grid">
                <div className="stat-mini-box">
                  <span className="v">{appliedPostingIds.length}</span>
                  <span className="l">Applied</span>
                </div>
                <div className="stat-mini-box">
                  <span className="v">{savedPostingIds.length}</span>
                  <span className="l">Saved</span>
                </div>
                <div className="stat-mini-box">
                  <span className="v">{studentGoalCompletion}%</span>
                  <span className="l">Goal Progress</span>
                </div>
              </div>

              <div className="skills-tags" style={{ marginTop: '20px', justifyContent: 'center' }}>
                <button type="button" className={`skill-tag ${studentGoals.resume ? "done" : ""}`} style={{ cursor: 'pointer', background: studentGoals.resume ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: studentGoals.resume ? 'white' : 'var(--muted)' }} onClick={() => toggleStudentGoal("resume")}>
                  {studentGoals.resume ? "✓ Resume" : "Resume"}
                </button>
                <button type="button" className={`skill-tag ${studentGoals.portfolio ? "done" : ""}`} style={{ cursor: 'pointer', background: studentGoals.portfolio ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: studentGoals.portfolio ? 'white' : 'var(--muted)' }} onClick={() => toggleStudentGoal("portfolio")}>
                  {studentGoals.portfolio ? "✓ Portfolio" : "Portfolio"}
                </button>
                <button type="button" className={`skill-tag ${studentGoals.interview ? "done" : ""}`} style={{ cursor: 'pointer', background: studentGoals.interview ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: studentGoals.interview ? 'white' : 'var(--muted)' }} onClick={() => toggleStudentGoal("interview")}>
                  {studentGoals.interview ? "✓ Interview" : "Interview"}
                </button>
              </div>
            </section>
          </div>
        )}

        <section className="bento-card" style={{ marginBottom: '24px' }}>
          <div className="bento-header">
            <div>
              <span className="bento-label">Filters</span>
              <h3>Feed Controls</h3>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button type="button" className="edit-btn-glass" onClick={toggleTheme}>
                {isDarkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
              <button type="button" className="edit-btn-glass" onClick={resetControls}>
                Reset
              </button>
            </div>
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

        <div className="feed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <section className="bento-card">
            <div className="bento-header">
              <div>
                <span className="bento-label">Opportunities</span>
                <h3>Internships</h3>
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
                  <div key={item.id} className="posting-card-pro">
                    <span className="card-tag active" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa' }}>Internship</span>
                    <div className="card-body-pro">
                      <span className="loc" style={{ marginBottom: '4px' }}>{item.company}</span>
                      <h4>{item.title}</h4>
                      <div className="card-stats-row" style={{ marginTop: '12px' }}>
                        <div className="c-stat">📍 {item.location}</div>
                        <div className="c-stat">🏠 {item.setup}</div>
                        {isStudentView && <div className="c-stat" style={{ color: 'var(--primary)' }}>{getMatchScore(item)}% Match</div>}
                      </div>
                    </div>
                    <div className="card-actions-pro">
                      <button type="button" className="edit-btn-glass" onClick={() => toggleSavedPosting(item)}>
                        {savedPostingIds.includes(item.id) ? "★ Saved" : "☆ Save"}
                      </button>
                      <button type="button" className="btn-primary-pro" style={{ padding: '6px' }} onClick={() => handlePrimaryPostingAction(item)}>
                        {appliedPostingIds.includes(item.id) ? "Applied" : "Apply"}
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
                <h3>Activity</h3>
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
                      {role === "EMPLOYER" ? (
                        <button type="button" className="btn-primary-pro" style={{ padding: '6px' }} onClick={() => showToast(`Opening ${item.student}'s profile`)}>View Profile</button>
                      ) : (
                        <button type="button" className="edit-btn-glass" onClick={() => showToast(`Followed ${item.student}`)}>Follow</button>
                      )}
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
                <button className="close-btn-glass" onClick={closePostingDetails}>✕</button>
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
                  <div className="detail-card-mini">
                    <span className="label">Deadline</span>
                    <p>{selectedPosting.deadline}</p>
                  </div>
                  <div className="detail-card-mini">
                    <span className="label">Applicants</span>
                    <p>{selectedPosting.applicants}</p>
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
                  {role === "EMPLOYER" ? (
                    <button type="button" className="btn-primary-pro" onClick={() => showToast("Opening management...")}>Manage</button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn-primary-pro" 
                      onClick={() => applyToPosting(selectedPosting)}
                      disabled={appliedPostingIds.includes(selectedPosting.id)}
                    >
                      {appliedPostingIds.includes(selectedPosting.id) ? "Applied" : "Confirm Application"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
