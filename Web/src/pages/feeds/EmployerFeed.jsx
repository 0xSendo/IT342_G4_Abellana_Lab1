import { useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/common/feed-base.css";
import "../../styles/employer/employer-feed.css";

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
];

export default function EmployerFeed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [backendPostings, setBackendPostings] = useState([]);
  const [feedSearch, setFeedSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchPostings = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get("/api/internships/active", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBackendPostings(res.data);
    } catch (err) {
      console.error("Failed to fetch postings", err);
    }
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  const filteredActivities = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    return STUDENT_ACTIVITY_FEED.filter((item) => {
      const text = [item.student, item.program, item.activity, item.details].join(" ").toLowerCase();
      return (!query || text.includes(query)) && (activityFilter === "ALL" || item.type === activityFilter);
    });
  }, [feedSearch, activityFilter]);

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="student-dashboard-wrapper">
        <section className="feed-hero">
           <div className="hero-text">
              <span className="hero-badge">Ecosystem Activity</span>
              <h3>Community Feed</h3>
              <p>See which students are active, explore postings, and review talent in one place.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass">
                <span className="val">{filteredActivities.length}</span>
                <span className="lab">Updates</span>
              </div>
            </div>
        </section>

        <section className="bento-card" style={{ marginBottom: '24px' }}>
          <div className="app-filters-mini">
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Search talent..."
            />
          </div>
        </section>

        <div className="feed-grid">
          <section className="bento-card">
            <div className="bento-header">
              <h3>Community Activity</h3>
            </div>
            <div className="postings-grid-pro" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredActivities.map((item) => (
                <div key={item.id} className="employer-activity-card">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4>{item.student}</h4>
                        <p className="feed-muted">{item.program} • {item.time}</p>
                      </div>
                      <span className="talent-pill">{item.type}</span>
                   </div>
                   <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--muted)' }}>{item.activity}</p>
                   <button className="btn-primary-pro" style={{ marginTop: '16px', padding: '8px' }} onClick={() => toast.show(`Viewing ${item.student}'s profile`)}>
                      View Talent Profile
                   </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
