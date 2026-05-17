import { useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/common/feed-base.css";
import "../../styles/employer/employer-feed.css";

export default function EmployerFeed() {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [allPostings, setAllPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedSearch, setFeedSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, MINE, OTHERS
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchAllPostings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get(`${API_BASE}/api/internships/active`, {
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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchAllPostings();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
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
      others: allPostings.filter(p => p.postedByEmail !== currentUser?.email).length
    };
  }, [allPostings, currentUser]);

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
              <p>Monitor industry trends, view competitive postings, and manage your presence in the talent market.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{stats.total}</span>
                <span className="lab">Active Roles</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{stats.mine}</span>
                <span className="lab">Your Posts</span>
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
                placeholder="Search by role, company, or location..."
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
        <div className="feed-grid-pro-v2" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }}>
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
                        <span className="post-date">Posted on {new Date(posting.startDate).toLocaleDateString()}</span>
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

          {/* Community Activity Bento (Restored) */}
          <section className="bento-card community-activity-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Coming Soon</span>
                <h3>Community Activity</h3>
              </div>
            </div>
            <div className="market-status-overlay" style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="empty-icon">👥</div>
              <p className="insight-text">
                Real-time community updates and student activity stream will appear here in the next update.
              </p>
              <div className="activity-skeleton" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ height: '60px', background: 'var(--glass)', borderRadius: '12px' }}></div>
                <div style={{ height: '60px', background: 'var(--glass)', borderRadius: '12px', opacity: 0.6 }}></div>
                <div style={{ height: '60px', background: 'var(--glass)', borderRadius: '12px', opacity: 0.3 }}></div>
              </div>
            </div>
          </section>
        </div>
      </div>

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
                      <div key={n.id} className={`notif-item-full ${n.read ? "" : "unread"}`}>
                        <div className="notif-icon-box">
                          {n.type === "APPLICATION" ? "📩" : "🔔"}
                        </div>
                        <div className="notif-content-full">
                          <h4 className="notif-title-full">{n.title}</h4>
                          <p className="notif-msg-full">{n.message}</p>
                          <span className="notif-time-full">
                            {new Date(n.createdAt).toLocaleString()}
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
