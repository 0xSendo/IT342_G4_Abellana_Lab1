import { useContext, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/dashboard.css";

const POSTING_FEED = [
  {
    id: 1,
    company: "Nova Digital",
    title: "Frontend Developer Intern",
    location: "Cebu, PH",
    setup: "Hybrid",
    time: "2 hours ago",
    summary: "React and UI work for an internal internship project.",
    deadline: "Apr 30, 2026",
    applicants: 12,
    tags: ["React", "UI", "Internship"],
  },
  {
    id: 2,
    company: "Vertex Solutions",
    title: "Systems Analyst Intern",
    location: "Quezon City, PH",
    setup: "Onsite",
    time: "5 hours ago",
    summary: "Support process mapping, documentation, and reporting.",
    deadline: "May 05, 2026",
    applicants: 9,
    tags: ["Documentation", "Process", "Support"],
  },
  {
    id: 3,
    company: "Insight Labs",
    title: "Data Analyst Intern",
    location: "Remote",
    setup: "Remote",
    time: "1 day ago",
    summary: "Build dashboards and assist with weekly insights.",
    deadline: "May 12, 2026",
    applicants: 18,
    tags: ["SQL", "Dashboards", "Analytics"],
  },
  {
    id: 4,
    company: "OrbitTech",
    title: "QA Engineering Intern",
    location: "Mandaluyong, PH",
    setup: "Hybrid",
    time: "2 days ago",
    summary: "Test product flows and document regression findings.",
    deadline: "May 02, 2026",
    applicants: 7,
    tags: ["Testing", "Automation", "Quality"],
  },
];

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

export default function Feed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();
  const role = currentUser?.role || "STUDENT";

  const [feedSearch, setFeedSearch] = useState("");
  const [postingFilter, setPostingFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("RECENT");
  const [savedPostingIds, setSavedPostingIds] = useState([]);
  const [selectedPosting, setSelectedPosting] = useState(null);

  const filteredPostings = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    const matches = POSTING_FEED.filter((item) => {
      const searchableText = [item.company, item.title, item.location, item.summary, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (postingFilter === "ALL" || item.setup === postingFilter);
    });

    return [...matches].sort((a, b) => {
      if (sortMode === "APPLICANTS") return b.applicants - a.applicants;
      if (sortMode === "COMPANY") return a.company.localeCompare(b.company);
      return b.id - a.id;
    });
  }, [feedSearch, postingFilter, sortMode]);

  const filteredActivities = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();

    return STUDENT_ACTIVITY_FEED.filter((item) => {
      const searchableText = [item.student, item.program, item.activity, item.details, item.type]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (activityFilter === "ALL" || item.type === activityFilter);
    });
  }, [feedSearch, activityFilter]);

  const savedPostings = POSTING_FEED.filter((item) => savedPostingIds.includes(item.id));

  const showToast = (message) => toast.show(message);

  const toggleSavedPosting = (posting) => {
    setSavedPostingIds((prev) => {
      const isSaved = prev.includes(posting.id);
      showToast(isSaved ? "Removed from saved posts" : "Saved for later review");
      return isSaved ? prev.filter((id) => id !== posting.id) : [...prev, posting.id];
    });
  };

  const openPostingDetails = (posting) => {
    setSelectedPosting(posting);
  };

  const closePostingDetails = () => {
    setSelectedPosting(null);
  };

  const handlePrimaryPostingAction = (posting) => {
    if (role === "EMPLOYER") {
      openPostingDetails(posting);
      return;
    }

    showToast(`Applied to ${posting.title}`);
  };

  const resetControls = () => {
    setFeedSearch("");
    setPostingFilter("ALL");
    setActivityFilter("ALL");
    setSortMode("RECENT");
  };

  return (
    <DashboardLayout title="Feed">
      <section className="card feed-hero">
        <div>
          <h3>Community Feed</h3>
          <p>
            {role === "EMPLOYER"
              ? "See which students are active, explore postings, and review talent in one place."
              : "Discover internship postings, track updates, and stay connected to employer opportunities."}
          </p>
        </div>
        <div className="feed-role-chip">
          {role === "EMPLOYER" ? "Employer View" : role === "ADMIN" ? "Admin View" : "Student View"}
        </div>
      </section>

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
          <span className="feed-muted">Your View</span>
          <strong>{role}</strong>
        </div>
      </section>

      <section className="card feed-toolbar-card">
        <div className="section-title-row">
          <h3>Feed Controls</h3>
          <div className="toolbar-actions">
            <span className="results-count">Live updates</span>
            <button type="button" className="action-btn" onClick={resetControls}>
              Reset
            </button>
          </div>
        </div>
        <div className="feed-controls">
          <input
            type="text"
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder="Search postings, companies, students, or skills"
          />
          <select value={postingFilter} onChange={(e) => setPostingFilter(e.target.value)}>
            <option value="ALL">All Setups</option>
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
            <option value="APPLICANTS">Sort: Most Applicants</option>
            <option value="COMPANY">Sort: Company A-Z</option>
          </select>
        </div>
      </section>

      <div className="feed-grid">
        <section className="card feed-column">
          <div className="section-title-row">
            <h3>Latest Internship Postings</h3>
            <span className="results-count">{filteredPostings.length} posts</span>
          </div>
          <div className="feed-list">
            {filteredPostings.length === 0 && <div className="feed-empty-state">No postings match the current filters.</div>}
            {filteredPostings.map((item) => (
              <article className="feed-card" key={item.id}>
                <div className="feed-card-head">
                  <div>
                    <span className="feed-muted">{item.company}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <span className="feed-pill feed-pill-posting">Posting</span>
                </div>
                <p>{item.summary}</p>
                <div className="feed-meta">
                  <span>{item.location}</span>
                  <span>{item.setup}</span>
                  <span>{item.time}</span>
                  <span>Due {item.deadline}</span>
                  <span>{item.applicants} applicant(s)</span>
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
                    {savedPostingIds.includes(item.id) ? "Saved" : "Save"}
                  </button>
                  {role === "EMPLOYER" ? (
                    <button type="button" className="primary-btn" onClick={() => openPostingDetails(item)}>
                      View Posting
                    </button>
                  ) : (
                    <button type="button" className="primary-btn" onClick={() => handlePrimaryPostingAction(item)}>
                      Apply
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card feed-column">
          <div className="section-title-row">
            <h3>Student Activity</h3>
            <span className="results-count">{filteredActivities.length} updates</span>
          </div>
          <div className="feed-list">
            {filteredActivities.length === 0 && (
              <div className="feed-empty-state">No student activity matches the current filters.</div>
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
                  <span className="feed-pill feed-pill-activity">Activity</span>
                </div>
                <p>{item.details}</p>
                <div className="feed-meta">
                  <span>{item.time}</span>
                  <span>{item.type.replace("_", " ")}</span>
                </div>
                <div className="feed-actions">
                  {role === "EMPLOYER" ? (
                    <>
                      <button type="button" className="action-btn small" onClick={() => showToast(`Shortlisted ${item.student}`)}>
                        Shortlist
                      </button>
                      <button type="button" className="action-btn small" onClick={() => showToast(`Opened ${item.student}'s profile`)}>
                        View Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="action-btn small" onClick={() => showToast(`Followed ${item.student}`)}>
                        Follow
                      </button>
                      <button type="button" className="action-btn small" onClick={() => showToast("Saved activity for later review")}>
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Feed posting details">
          <div className="modal-panel feed-modal-panel">
            <div className="section-title-row">
              <h3>Posting Details</h3>
              <button type="button" className="action-btn" onClick={closePostingDetails}>
                Close
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
                <button type="button" className="action-btn" onClick={() => showToast("Opening posting management")}>Open in Dashboard</button>
              ) : (
                <button type="button" className="action-btn" onClick={() => handlePrimaryPostingAction(selectedPosting)}>
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
