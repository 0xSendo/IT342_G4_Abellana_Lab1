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
      <section className="card feed-hero">
        <div className="hero-text">
          <h3>{isStudentView ? "Student Opportunity Hub" : "Community Feed"}</h3>
          <p>
            {role === "EMPLOYER"
              ? "See which students are active, explore postings, and review talent in one place."
              : "Get role-matched internships, monitor your progress, and build momentum in one focused student feed."}
          </p>
        </div>
        <div className="feed-role-chip">
          {role === "EMPLOYER" ? "Employer View" : role === "ADMIN" ? "Admin View" : "Student View"}
        </div>
      </section>

      {isStudentView && (
        <div className="student-dashboard-grid">
          <section className="card student-notification-card">
            <div className="student-feed-head">
              <div>
                <h3>🔔 Notifications</h3>
                <p className="feed-muted">Stay updated on deadlines and matches.</p>
              </div>
              <div className="student-notification-head-actions">
                <span className="student-notification-badge">{unreadStudentNotifications} NEW</span>
                <button type="button" className="action-btn small" onClick={markAllNotificationsRead}>
                  Mark all read
                </button>
              </div>
            </div>

            <div className="student-notification-list">
              {studentNotifications.length === 0 && (
                <div className="feed-empty-state">No notifications right now.</div>
              )}
              {studentNotifications.map((item) => (
                <article key={item.id} className={`student-notification-item ${item.read ? "read" : "unread"}`}>
                  <div className="notif-content">
                    <p className="student-notification-title">{item.title}</p>
                    <p className="student-notification-message">{item.message}</p>
                    <span className="feed-muted">{item.type} • {item.time}</span>
                  </div>
                  <div className="student-notification-actions">
                    <button type="button" className="action-btn small" onClick={() => openNotificationContext(item)}>
                      Open
                    </button>
                    {!item.read && (
                      <button type="button" className="action-btn small" onClick={() => markNotificationRead(item.id)}>
                        Read
                      </button>
                    )}
                    <button type="button" className="action-btn small danger" onClick={() => dismissNotification(item.id)}>
                      ✕
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card student-feed-hub">
            <div className="student-feed-head">
              <div>
                <h3>🚀 Career Planner</h3>
                <p className="feed-muted">Build your momentum and track progress.</p>
              </div>
              <button type="button" className="action-btn small" onClick={() => setHiddenPostingIds([])}>
                Restore Hidden
              </button>
            </div>

            <div className="student-feed-stats">
              <div className="student-stat-card">
                <span className="feed-muted">Applied</span>
                <strong>{appliedPostingIds.length}</strong>
              </div>
              <div className="student-stat-card">
                <span className="feed-muted">Saved</span>
                <strong>{savedPostingIds.length}</strong>
              </div>
              <div className="student-stat-card">
                <span className="feed-muted">Goal Progress</span>
                <strong>{studentGoalCompletion}%</strong>
              </div>
            </div>

            <div className="student-feed-actions">
              <div className="student-tab-row">
                <button
                  type="button"
                  className={`action-btn small ${studentTab === "DISCOVER" ? "student-tab-active" : ""}`}
                  onClick={() => setStudentTab("DISCOVER")}
                >
                  Discover
                </button>
                <button
                  type="button"
                  className={`action-btn small ${studentTab === "SAVED" ? "student-tab-active" : ""}`}
                  onClick={() => setStudentTab("SAVED")}
                >
                  Saved
                </button>
                <button
                  type="button"
                  className={`action-btn small ${studentTab === "APPLIED" ? "student-tab-active" : ""}`}
                  onClick={() => setStudentTab("APPLIED")}
                >
                  Applied
                </button>
              </div>

              <select value={studentAlertSetup} onChange={(e) => setStudentAlertSetup(e.target.value)} className="action-btn small">
                <option value="ALL">All Setups</option>
                <option value="Remote">Remote First</option>
                <option value="Hybrid">Hybrid Focus</option>
                <option value="Onsite">Onsite Focus</option>
              </select>
            </div>

            <div className="student-goal-grid">
              <button type="button" className={`student-goal-item ${studentGoals.resume ? "done" : ""}`} onClick={() => toggleStudentGoal("resume")}>
                {studentGoals.resume ? "✓ Resume" : "Resume"}
              </button>
              <button type="button" className={`student-goal-item ${studentGoals.portfolio ? "done" : ""}`} onClick={() => toggleStudentGoal("portfolio")}>
                {studentGoals.portfolio ? "✓ Portfolio" : "Portfolio"}
              </button>
              <button type="button" className={`student-goal-item ${studentGoals.interview ? "done" : ""}`} onClick={() => toggleStudentGoal("interview")}>
                {studentGoals.interview ? "✓ Interview" : "Interview"}
              </button>
              <button type="button" className={`student-goal-item ${studentGoals.networking ? "done" : ""}`} onClick={() => toggleStudentGoal("networking")}>
                {studentGoals.networking ? "✓ Networking" : "Network"}
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="card feed-summary-grid">
        <div className="feed-summary-card">
          <span className="feed-muted">Visible Postings</span>
          <strong>{filteredPostings.length}</strong>
        </div>
        <div className="feed-summary-card">
          <span className="feed-muted">Activity Updates</span>
          <strong>{filteredActivities.length}</strong>
        </div>
        <div className="feed-summary-card">
          <span className="feed-muted">Saved Posts</span>
          <strong>{savedPostings.length}</strong>
        </div>
        <div className="feed-summary-card">
          <span className="feed-muted">Current Role</span>
          <strong>{role}</strong>
        </div>
      </section>

      <section className="card feed-toolbar-card">
        <div className="section-title-row">
          <h3>⚡ Feed Controls</h3>
          <div className="toolbar-actions">
            <button type="button" className="action-btn small" onClick={toggleTheme}>
              {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button type="button" className="action-btn small" onClick={resetControls}>
              Reset Filters
            </button>
          </div>
        </div>
        <div className="feed-controls">
          <input
            type="text"
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder="Search anything..."
            className="search-input"
          />
          <select value={postingFilter} onChange={(e) => setPostingFilter(e.target.value)}>
            <option value="ALL">Work Setup</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
          <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
            {Object.entries(ACTIVITY_FILTERS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="RECENT">Sort: Recent</option>
            <option value="APPLICANTS">Most Popular</option>
            <option value="COMPANY">Company A-Z</option>
          </select>
        </div>
      </section>

      <div className="feed-grid">
        <section className="card feed-column">
          <div className="section-title-row">
            <h3>💼 Job Postings</h3>
            <span className="results-badge">{filteredPostings.length} results</span>
          </div>
          <div className="feed-list">
            {(isLoading && backendPostings.length === 0) ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p>Loading real-time opportunities...</p>
              </div>
            ) : filteredPostings.length === 0 && (
              <div className="feed-empty-state">No matching internships found.</div>
            )}
            {filteredPostings.map((item) => (
              <article className="feed-card" key={item.id}>
                <div className="feed-card-head">
                  <div>
                    <span className="feed-muted">{item.company}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <span className="feed-pill">Internship</span>
                </div>
                <p className="feed-summary">{item.summary}</p>
                <div className="feed-meta">
                  <span>📍 {item.location}</span>
                  <span>🏠 {item.setup}</span>
                  <span>⏰ {item.time}</span>
                  {isStudentView && <span className="feed-match-chip">{getMatchScore(item)}% Match</span>}
                </div>
                <div className="feed-tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="feed-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="feed-actions">
                  <button type="button" className="action-btn small" onClick={() => toggleSavedPosting(item)}>
                    {savedPostingIds.includes(item.id) ? "★ Saved" : "☆ Save"}
                  </button>
                  {role === "EMPLOYER" ? (
                    <button type="button" className="primary-btn" onClick={() => openPostingDetails(item)}>
                      Manage
                    </button>
                  ) : (
                    <button type="button" className="primary-btn" onClick={() => handlePrimaryPostingAction(item)}>
                      {appliedPostingIds.includes(item.id) ? "Applied" : "Apply Now"}
                    </button>
                  )}
                  {isStudentView && (
                    <button type="button" className="action-btn small" onClick={() => hidePosting(item)}>
                      Hide
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card feed-column">
          <div className="section-title-row">
            <h3>✨ Community Activity</h3>
            <span className="results-badge">{filteredActivities.length} updates</span>
          </div>
          <div className="feed-list">
            {filteredActivities.length === 0 && (
              <div className="feed-empty-state">No recent activity found.</div>
            )}
            {filteredActivities.map((item) => (
              <article className="feed-card" key={item.id}>
                <div className="feed-card-head">
                  <div>
                    <span className="feed-muted">
                      {item.student} • {item.program}
                    </span>
                    <h4>{item.activity}</h4>
                  </div>
                  <span className="feed-pill">Activity</span>
                </div>
                <p className="feed-summary">{item.details}</p>
                <div className="feed-meta">
                  <span>⏰ {item.time}</span>
                  <span>🏷️ {item.type.replace("_", " ")}</span>
                </div>
                <div className="feed-actions">
                  {role === "EMPLOYER" ? (
                    <>
                      <button type="button" className="action-btn small" onClick={() => showToast(`Shortlisted ${item.student}`)}>
                        Shortlist
                      </button>
                      <button type="button" className="primary-btn" onClick={() => showToast(`Opening ${item.student}'s profile`)}>
                        View Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="action-btn small" onClick={() => showToast(`Followed ${item.student}`)}>
                        Follow
                      </button>
                      <button type="button" className="action-btn small" onClick={() => showToast("Saved activity")}>
                        Save
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {selectedPosting && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel feed-modal-panel">
            <div className="section-title-row">
              <h3>Internship Details</h3>
              <button type="button" className="action-btn small" onClick={closePostingDetails}>
                ✕
              </button>
            </div>
            <div className="feed-detail-grid">
              <div>
                <span className="profile-label">Company</span>
                <p>{selectedPosting.company}</p>
              </div>
              <div>
                <span className="profile-label">Role</span>
                <p>{selectedPosting.title}</p>
              </div>
              <div>
                <span className="profile-label">Location</span>
                <p>{selectedPosting.location}</p>
              </div>
              <div>
                <span className="profile-label">Setup</span>
                <p>{selectedPosting.setup}</p>
              </div>
              <div>
                <span className="profile-label">Deadline</span>
                <p>{selectedPosting.deadline}</p>
              </div>
              <div>
                <span className="profile-label">Applicants</span>
                <p>{selectedPosting.applicants}</p>
              </div>
              <div className="application-note-block">
                <span className="profile-label">Description</span>
                <p>{selectedPosting.summary}</p>
              </div>
            </div>
            <div className="feed-detail-actions">
              <button type="button" className="primary-btn" onClick={() => toggleSavedPosting(selectedPosting)}>
                {savedPostingIds.includes(selectedPosting.id) ? "Unsave" : "Save for Later"}
              </button>
              {role === "EMPLOYER" ? (
                <button type="button" className="action-btn" onClick={() => showToast("Opening management...")}>Management Dashboard</button>
              ) : (
                <button 
                  type="button" 
                  className="action-btn" 
                  onClick={() => applyToPosting(selectedPosting)}
                  disabled={appliedPostingIds.includes(selectedPosting.id)}
                >
                  {appliedPostingIds.includes(selectedPosting.id) ? "Already Applied" : "Confirm Application"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
