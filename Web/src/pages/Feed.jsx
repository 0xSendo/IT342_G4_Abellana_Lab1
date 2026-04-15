import { useContext } from "react";
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
  },
  {
    id: 2,
    company: "Vertex Solutions",
    title: "Systems Analyst Intern",
    location: "Quezon City, PH",
    setup: "Onsite",
    time: "5 hours ago",
    summary: "Support process mapping, documentation, and reporting.",
  },
  {
    id: 3,
    company: "Insight Labs",
    title: "Data Analyst Intern",
    location: "Remote",
    setup: "Remote",
    time: "1 day ago",
    summary: "Build dashboards and assist with weekly insights.",
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
  },
  {
    id: 2,
    student: "Maria Santos",
    program: "BSCS",
    activity: "Applied to Frontend Developer Intern",
    time: "3 hours ago",
    details: "Currently shortlisted for technical interview.",
  },
  {
    id: 3,
    student: "Alyssa Tan",
    program: "BSIT",
    activity: "Completed profile verification",
    time: "1 day ago",
    details: "Ready for employer review and recruitment.",
  },
];

export default function Feed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();
  const role = currentUser?.role || "STUDENT";

  const handleAction = (message) => {
    toast.show(message);
  };

  return (
    <DashboardLayout title="Feed">
      <section className="card feed-hero">
        <div>
          <h3>Community Feed</h3>
          <p>
            {role === "EMPLOYER"
              ? "See what students are updating and which candidates are active for recruitment."
              : "Discover internship postings and stay updated on employer opportunities."}
          </p>
        </div>
        <div className="feed-role-chip">{role === "EMPLOYER" ? "Employer View" : role === "ADMIN" ? "Admin View" : "Student View"}</div>
      </section>

      <div className="feed-grid">
        <section className="card feed-column">
          <div className="section-title-row">
            <h3>Latest Internship Postings</h3>
            <span className="results-count">{POSTING_FEED.length} posts</span>
          </div>
          <div className="feed-list">
            {POSTING_FEED.map((item) => (
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
                </div>
                <div className="feed-actions">
                  <button type="button" className="action-btn small" onClick={() => handleAction("Posting saved to your feed")}>Save</button>
                  <button type="button" className="primary-btn" onClick={() => handleAction("Application action coming next")}>Apply</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card feed-column">
          <div className="section-title-row">
            <h3>Student Activity</h3>
            <span className="results-count">{STUDENT_ACTIVITY_FEED.length} updates</span>
          </div>
          <div className="feed-list">
            {STUDENT_ACTIVITY_FEED.map((item) => (
              <article className="feed-card" key={item.id}>
                <div className="feed-card-head">
                  <div>
                    <span className="feed-muted">{item.student} • {item.program}</span>
                    <h4>{item.activity}</h4>
                  </div>
                  <span className="feed-pill feed-pill-activity">Activity</span>
                </div>
                <p>{item.details}</p>
                <div className="feed-meta">
                  <span>{item.time}</span>
                </div>
                <div className="feed-actions">
                  <button type="button" className="action-btn small" onClick={() => handleAction("Candidate shortlisted")}>Shortlist</button>
                  <button type="button" className="action-btn small" onClick={() => handleAction("Student profile opened")}>View Profile</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
