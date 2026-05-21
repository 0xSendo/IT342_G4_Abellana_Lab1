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
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
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

  const [visiblePostings, setVisiblePostings] = useState(6);
  const [visibleActivities, setVisibleActivities] = useState(5);

  const hasExistingPost = useMemo(() => {
    return communityPosts.some(p => p.studentEmail === currentUser?.email);
  }, [communityPosts, currentUser]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  const validatePostContent = (content) => {
    if (!content) return true;
    
    // 1. URL/Link detection
    const urlPattern = /((https?:\/\/|www\.)[^\s]+|([a-z0-9]+\.)+(com|net|org|io|gov|edu|ph|link|me|xyz))/gi;
    if (urlPattern.test(content)) {
      toast.show("Security Alert: External links and URLs are not allowed in community posts for safety.", "error");
      return false;
    }

    // 2. Sensitive Topics / Prohibited Keywords
    const forbiddenTerms = [
      "crypto", "bitcoin", "ethereum", "casino", "gambling", "betting", "lottery",
      "porn", "nude", "explicit", "fuck", "shit", "bitch", "asshole",
      "puta", "gago", "tarantado", "pakyu", "kupal",
      "hack", "exploit", "phishing", "scam",
      "rape", "murder", "suicide", "bomb", "terrorist"
    ];
    
    const lowercaseContent = content.toLowerCase();
    const foundTerm = forbiddenTerms.find(term => lowercaseContent.includes(term));
    
    if (foundTerm) {
      toast.show("Content Violation: Your post contains prohibited language or sensitive topics.", "error");
      return false;
    }

    return true;
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

  const fetchCommunityPosts = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get("/api/community/all", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      console.log(`Live Data Check: Fetched ${res.data?.length || 0} community posts`);
      setCommunityPosts(res.data || []);
    } catch (err) {
      console.error("Critical: Failed to sync community posts", err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    if (!validatePostContent(newPostContent)) return;

    // Frontend pre-check: Check if student already has a post in the current list
    const hasExisting = communityPosts.some(p => p.studentEmail === currentUser?.email);
    if (hasExisting) {
      toast.show("Action Denied: You can only have one active community post. Please edit or delete your current post.", "error");
      return;
    }

    try {
      setIsPosting(true);
      const token = localStorage.getItem("internmatch_token");
      await axios.post("/api/community/post", {
        content: newPostContent,
        type: "GENERAL_UPDATE"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewPostContent("");
      toast.show("Status shared with the community!");
      await fetchCommunityPosts();
    } catch (err) {
      console.error("Failed to post", err);
      const backendMsg = err.response?.data?.message || err.response?.data;
      const isLimitError = backendMsg === "LIMIT_REACHED";
      const isModerationError = typeof backendMsg === 'string' && backendMsg.includes("MODERATION_ERROR");

      if (isLimitError) {
        toast.show("Action Denied: One post limit per student. Please manage your existing post.", "error");
      } else if (isModerationError) {
        toast.show(backendMsg.replace("MODERATION_ERROR: ", ""), "error");
      } else {
        toast.show("Failed to share update", "error");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`/api/community/delete/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.show("Post deleted");
      fetchCommunityPosts();
    } catch (err) {
      console.error("Failed to delete post", err);
      toast.show("Failed to delete post", "error");
    }
  };

  const handleUpdatePost = async (postId) => {
    if (!editPostContent.trim()) return;

    if (!validatePostContent(editPostContent)) return;

    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.put(`/api/community/update/${postId}`, {
        content: editPostContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.show("Post updated");
      setEditingPostId(null);
      fetchCommunityPosts();
    } catch (err) {
      console.error("Failed to update post", err);
      const backendMsg = err.response?.data?.message || err.response?.data;
      const isModerationError = typeof backendMsg === 'string' && backendMsg.includes("MODERATION_ERROR");

      if (isModerationError) {
        toast.show(backendMsg.replace("MODERATION_ERROR: ", ""), "error");
      } else {
        toast.show("Failed to update post", "error");
      }
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content);
  };

  const shareProfileToCommunity = async () => {
    if (!currentUser) {
      toast.show("Please complete your profile first", "error");
      return;
    }

    // Explicit Pre-check to prevent race conditions
    const existing = communityPosts.find(p => p.studentEmail === currentUser?.email);
    if (existing) {
      toast.show("Action Denied: You already have an active profile presence. Please edit or delete your existing post to share a new one.", "error");
      return;
    }

    try {
      const content = `Hi everyone! I'm ${currentUser.name || "a student"}, a ${currentUser.program || "dedicated"} student. I'm currently looking for internships in ${currentUser.skills || "tech"}. Check out my profile!`;
      const token = localStorage.getItem("internmatch_token");
      if (!token) {
        toast.show("Session expired, please login again", "error");
        return;
      }

      await axios.post("/api/community/post", {
        content,
        type: "PROFILE_SHARE"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.show("Profile shared to community feed!");
      await fetchCommunityPosts();
    } catch (err) {
      console.error("Failed to share profile", err);
      const backendMsg = err.response?.data?.message || err.response?.data;
      const isLimitError = backendMsg === "LIMIT_REACHED";
      const isModerationError = typeof backendMsg === 'string' && backendMsg.includes("MODERATION_ERROR");

      if (isLimitError) {
        toast.show("Action Denied: One post limit per student. Please manage your existing post.", "error");
      } else if (isModerationError) {
        toast.show(backendMsg.replace("MODERATION_ERROR: ", ""), "error");
      } else {
        toast.show("Failed to share profile. Please try again.", "error");
      }
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
    fetchCommunityPosts();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchCommunityPosts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setVisiblePostings(6);
    setVisibleActivities(5);
  }, [feedSearch, postingFilter, activityFilter, sortMode]);

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
    return communityPosts.filter((item) => {
      const searchableText = [item.studentName, item.studentProgram, item.content, item.type]
        .join(" ")
        .toLowerCase();
      return (!query || searchableText.includes(query)) && (activityFilter === "ALL" || item.type === activityFilter);
    });
  }, [communityPosts, feedSearch, activityFilter]);

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
      await axios.put("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.put(`/api/connections/respond/${connectionId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.show(`Connection request ${status === 'ACCEPTED' ? 'accepted' : 'declined'}`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to respond to request", err);
      toast.show("Failed to respond to request", "error");
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

        {/* Community Posting & Filters */}
        <div className="feed-controls-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <section className="bento-card community-post-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Community</span>
                <h3>Share an Update</h3>
              </div>
              <button 
                className="btn-secondary-glass" 
                style={{ fontSize: '0.75rem' }} 
                onClick={shareProfileToCommunity}
                disabled={hasExistingPost}
              >
                {hasExistingPost ? "Profile Shared ✓" : "Share My Profile 🚀"}
              </button>
            </div>
            {hasExistingPost && (
              <div style={{ 
                background: 'rgba(57, 198, 184, 0.1)', 
                border: '1px solid rgba(57, 198, 184, 0.2)', 
                borderRadius: '8px', 
                padding: '8px 12px', 
                marginTop: '1rem',
                fontSize: '0.8rem',
                color: '#39c6b8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>ℹ️ You have an active community post. You can edit or delete it below.</span>
              </div>
            )}
            <form onSubmit={handleCreatePost} style={{ marginTop: '1.25rem' }}>
              <div className="post-input-wrapper" style={{ position: 'relative' }}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={hasExistingPost ? "You already have an active post." : "What's happening? Share your progress or ask a question..."}
                  rows={3}
                  disabled={hasExistingPost}
                  style={{ 
                    width: '100%', 
                    background: 'var(--glass)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '14px', 
                    padding: '1rem',
                    color: 'var(--text)',
                    resize: 'none',
                    opacity: hasExistingPost ? 0.6 : 1
                  }}
                />
                <button 
                  type="submit" 
                  className="btn-primary-pro" 
                  disabled={isPosting || !newPostContent.trim() || hasExistingPost}
                  style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '6px 16px', fontSize: '0.85rem' }}
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
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

        {/* Filter Bar */}
        <section className="bento-card filter-bento" style={{ marginBottom: '2rem' }}>
            <div className="bento-header">
              <div>
                <span className="bento-label">Refine Feed</span>
                <h3>Search & Filters</h3>
              </div>
              <button type="button" className="edit-btn-glass" onClick={resetControls}>Reset</button>
            </div>
            <div className="filter-grid-enhanced">
              <div className="filter-input-group">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  placeholder="Search by role, company, or skills..."
                />
              </div>
              <div className="filter-select-wrapper">
                <select value={postingFilter} onChange={(e) => setPostingFilter(e.target.value)}>
                  <option value="ALL">All Setups</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>
              <div className="filter-select-wrapper">
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                  <option value="RECENT">Newest First</option>
                  <option value="APPLICANTS">Most Popular</option>
                  <option value="COMPANY">A-Z Company</option>
                </select>
              </div>
            </div>
        </section>

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
                  <>
                    {filteredPostings.slice(0, visiblePostings).map((item) => (
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
                    ))}
                    
                    {filteredPostings.length > visiblePostings && (
                      <div className="load-more-wrapper">
                        <button className="btn-load-more" onClick={() => setVisiblePostings(prev => prev + 6)}>
                          <span>Load More Opportunities</span>
                          <span className="icon">▾</span>
                        </button>
                      </div>
                    )}
                  </>
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
                {filteredActivities.length === 0 ? (
                  <p className="feed-muted" style={{ textAlign: 'center', padding: '20px' }}>No community activity yet.</p>
                ) : (
                  <>
                    {filteredActivities.slice(0, visibleActivities).map((item) => {
                      const isOwnPost = item.studentEmail === currentUser?.email;
                      const isEditing = editingPostId === item.id;

                      return (
                        <div key={item.id} className="posting-card-pro" style={{ padding: '1rem', borderLeft: item.type === 'PROFILE_SHARE' ? '3px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="activity-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="loc" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.studentName}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{item.studentProgram}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                                {formatTime(item.createdAt)}
                              </span>
                              {isOwnPost && !isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    onClick={() => startEditing(item)} 
                                    style={{ 
                                      background: 'rgba(255,255,255,0.05)', 
                                      border: '1px solid rgba(255,255,255,0.1)', 
                                      borderRadius: '6px',
                                      cursor: 'pointer', 
                                      fontSize: '0.75rem', 
                                      padding: '4px 8px',
                                      color: 'var(--text)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <span>Edit</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePost(item.id)} 
                                    style={{ 
                                      background: 'rgba(255,107,74,0.1)', 
                                      border: '1px solid rgba(255,107,74,0.2)', 
                                      borderRadius: '6px',
                                      cursor: 'pointer', 
                                      fontSize: '0.75rem', 
                                      padding: '4px 8px',
                                      color: 'var(--primary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <div style={{ marginTop: '8px' }}>
                              <textarea 
                                value={editPostContent} 
                                onChange={(e) => setEditPostContent(e.target.value)}
                                rows={2}
                                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--text)', padding: '8px', fontSize: '0.85rem' }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                <button onClick={() => setEditingPostId(null)} className="edit-btn-glass" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Cancel</button>
                                <button onClick={() => handleUpdatePost(item.id)} className="btn-primary-pro" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '8px 0 0', lineHeight: 1.4 }}>{item.content}</p>
                          )}

                          {item.type === 'PROFILE_SHARE' && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, marginTop: '4px', display: 'block' }}>🚀 SHARED PROFILE</span>
                          )}
                        </div>
                      );
                    })}

                    {filteredActivities.length > visibleActivities && (
                      <button className="btn-load-more" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={() => setVisibleActivities(prev => prev + 5)}>
                        <span>See More Activity</span>
                        <span className="icon">▾</span>
                      </button>
                    )}
                  </>
                )}
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
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif-item-full ${n.read ? "" : "unread"}`} style={{ position: 'relative' }}>
                        <div className="notif-icon-box">
                          {n.title.toLowerCase().includes("accept") ? "🎉" : 
                           n.title.toLowerCase().includes("reject") ? "🤝" : "📩"}
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
                          {n.type === "CONNECTION_REQUEST" && !n.read && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                              <button 
                                className="btn-primary-pro" 
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                onClick={() => respondToRequest(n.relatedId, 'ACCEPTED')}
                              >
                                Accept
                              </button>
                              <button 
                                className="btn-secondary-glass" 
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                onClick={() => respondToRequest(n.relatedId, 'DECLINED')}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          <span className="notif-time-full">{formatDateTime(n.createdAt)}</span>
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
