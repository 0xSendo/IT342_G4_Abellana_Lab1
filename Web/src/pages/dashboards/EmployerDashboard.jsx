import { useContext, useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget";
import "../../styles/common/bento.css";
import "../../styles/employer/employer-dashboard.css";
import "../../styles/notifications.css";

const INITIAL_POSTING_FORM = {
  title: "",
  location: "",
  setup: "Hybrid",
  status: "ACTIVE",
  description: "",
};

export default function EmployerDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const { openChatWith } = useChat();
  const toast = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [isCreatePostingModalOpen, setIsCreatePostingModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [isPostingEditMode, setIsPostingEditMode] = useState(false);
  const [postingEditForm, setPostingEditForm] = useState(INITIAL_POSTING_FORM);
  const [postingSearch, setPostingSearch] = useState("");
  const [postingStatusFilter, setPostingStatusFilter] = useState("ALL");
  const [applicantSearch, setApplicantSearch] = useState("");
  const [applicantStatusFilter, setApplicantStatusFilter] = useState("ALL");
  const [postings, setPostings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfileTab, setStudentProfileTab] = useState("essentials");
  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("NONE");
  const [postingForm, setPostingForm] = useState(INITIAL_POSTING_FORM);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    companyName: currentUser?.companyName || "",
    companyLocation: currentUser?.companyLocation || "",
    companyWebsite: currentUser?.companyWebsite || "",
  });
  const [status, setStatus] = useState("");
  const [createPostingError, setCreatePostingError] = useState("");

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

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchConnectionsData = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      
      const [pendingRes, friendsRes] = await Promise.all([
        axios.get("/api/connections/pending", { headers: { "Authorization": `Bearer ${token}` } }),
        axios.get("/api/connections/friends", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      setPendingRequests(pendingRes.data);
      setFriends(friendsRes.data);
    } catch (err) {
      console.error("Failed to fetch connections", err);
    }
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.put(`/api/connections/respond/${connectionId}?status=${status}`, {}, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      toast.show(`Request ${status === 'ACCEPTED' ? 'accepted' : 'declined'}`);
      fetchConnectionsData();
    } catch (err) {
      console.error("Failed to respond to request", err);
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

  const openStudentProfile = (applicant) => {
    // Map applicant fields to selectedStudent format used in the modal
    setSelectedStudent({
      studentId: applicant.studentId,
      studentName: applicant.name,
      studentProgram: applicant.studentProgram,
      studentYearLevel: applicant.studentYearLevel,
      studentBio: applicant.studentBio,
      studentSkills: applicant.studentSkills,
      studentProjects: applicant.studentProjects,
      studentResumeUrl: applicant.studentResumeUrl
    });
    setStudentProfileTab("essentials");
    setIsStudentProfileModalOpen(true);
    if (applicant.studentId) {
      fetchConnectionStatus(applicant.studentId);
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
      toast.show("Failed to send request", "error");
    }
  };

  const fetchMyPostings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get("/api/internships/my-postings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      
      // Fetch applicant counts and details for each posting
      const postingsWithCounts = await Promise.all(data.map(async (p) => {
        try {
          const appRes = await axios.get(`/api/applications/internship/${p.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return { ...p, applicants: appRes.data.length, applicantsList: appRes.data };
        } catch (e) {
          return { ...p, applicants: 0, applicantsList: [] };
        }
      }));
      
      setPostings(postingsWithCounts);

      // Map all applications to the applicants state for the Recent Applicants table
      const allApplicants = postingsWithCounts.flatMap(p => 
        (p.applicantsList || []).map(app => ({
          id: app.id,
          name: app.studentName,
          internship: app.internshipTitle,
          dateApplied: new Date(app.appliedAt).toISOString().split('T')[0],
          status: app.status,
          note: "New application received via portal.",
          studentId: app.studentId,
          studentBio: app.studentBio,
          studentSkills: app.studentSkills,
          studentProjects: app.studentProjects,
          studentProgram: app.studentProgram,
          studentYearLevel: app.studentYearLevel,
          studentResumeUrl: app.resumePath,
        }))
      );

      setApplicants(allApplicants);
    } catch (err) {
      console.error("Failed to fetch postings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPostings();
    fetchNotifications();
    fetchConnectionsData();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchConnectionsData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      companyName: currentUser?.companyName || "",
      companyLocation: currentUser?.companyLocation || "",
      companyWebsite: currentUser?.companyWebsite || "",
    });
  }, [currentUser]);

  // Derived State
  const normalizedPostingSearch = postingSearch.trim().toLowerCase();
  const filteredPostings = postings.filter((posting) => {
    const matchesStatus = postingStatusFilter === "ALL" || posting.status === postingStatusFilter;
    const matchesSearch =
      !normalizedPostingSearch ||
      posting.title.toLowerCase().includes(normalizedPostingSearch) ||
      posting.location.toLowerCase().includes(normalizedPostingSearch);
    return matchesStatus && matchesSearch;
  });

  const normalizedApplicantSearch = applicantSearch.trim().toLowerCase();
  const filteredApplicants = applicants.filter((applicant) => {
    const matchesStatus = applicantStatusFilter === "ALL" || applicant.status === applicantStatusFilter;
    const matchesSearch =
      !normalizedApplicantSearch ||
      applicant.name.toLowerCase().includes(normalizedApplicantSearch) ||
      applicant.internship.toLowerCase().includes(normalizedApplicantSearch);
    return matchesStatus && matchesSearch;
  });

  const activePostingsCount = postings.filter((p) => p.status === "ACTIVE").length;
  const newApplicantsCount = applicants.filter((a) => a.status === "PENDING").length;
  const shortlistedApplicantsCount = applicants.filter((a) => a.status === "SHORTLISTED").length;

  const profileFields = [
    currentUser?.name,
    currentUser?.email,
    currentUser?.companyName,
    currentUser?.companyLocation,
    currentUser?.companyWebsite,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter((field) => !!String(field || "").trim()).length / profileFields.length) * 100
  );

  // Handlers
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPostingFormChange = (e) => {
    const { name, value } = e.target;
    setPostingForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPostingEditFormChange = (e) => {
    const { name, value } = e.target;
    setPostingEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openProfileModal = () => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      companyName: currentUser?.companyName || "",
      companyLocation: currentUser?.companyLocation || "",
      companyWebsite: currentUser?.companyWebsite || "",
    });
    setStatus("");
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const openCreatePostingModal = () => {
    setPostingForm(INITIAL_POSTING_FORM);
    setCreatePostingError("");
    setIsCreatePostingModalOpen(true);
  };

  const closeCreatePostingModal = () => {
    setIsCreatePostingModalOpen(false);
  };

  const clearPostingFilters = () => {
    setPostingSearch("");
    setPostingStatusFilter("ALL");
  };

  const clearApplicantFilters = () => {
    setApplicantSearch("");
    setApplicantStatusFilter("ALL");
  };

  const viewPosting = (posting) => {
    setSelectedPosting(posting);
    setPostingEditForm({
      title: posting.title,
      location: posting.location,
      setup: posting.setup || "Hybrid",
      status: posting.status,
      description: posting.description,
    });
    setIsPostingEditMode(false);
    setIsPostingModalOpen(true);
  };

  const closePostingModal = () => {
    setSelectedPosting(null);
    setIsPostingModalOpen(false);
    setIsPostingEditMode(false);
  };

  const openPostingEditMode = () => {
    if (!selectedPosting) return;
    setPostingEditForm({
      title: selectedPosting.title,
      location: selectedPosting.location,
      setup: selectedPosting.setup || "Hybrid",
      status: selectedPosting.status,
      description: selectedPosting.description,
    });
    setIsPostingEditMode(true);
  };

  const cyclePostingStatus = async (postingId) => {
    const posting = postings.find(p => p.id === postingId);
    if (!posting) return;

    const nextStatus = posting.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.put(`/api/internships/${postingId}`, {
        ...posting,
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPostings((prev) =>
        prev.map((p) => (p.id === postingId ? { ...p, status: nextStatus } : p))
      );
      toast.show("Posting status updated");
    } catch (err) {
      console.error("Status toggle error:", err);
      toast.show("Failed to update status", "error");
    }
  };

  const submitNewPosting = async (e) => {
    e.preventDefault();
    setCreatePostingError("");

    const title = postingForm.title.trim();
    const location = postingForm.location.trim();
    const description = postingForm.description.trim();

    if (!title || !location || !description) {
      setCreatePostingError("Please fill out all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.post("/api/internships", {
        title,
        description,
        company: currentUser?.companyName || "My Company",
        location,
        setup: postingForm.setup,
        status: postingForm.status,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPostings((prev) => [res.data, ...prev]);
      setIsCreatePostingModalOpen(false);
      setPostingForm(INITIAL_POSTING_FORM);
      toast.show("Internship posted successfully");
    } catch (err) {
      console.error("Create posting error:", err);
      setCreatePostingError(err.response?.data || "Failed to create posting");
    }
  };

  const removePosting = async (postingId) => {
    if (!window.confirm("Are you sure you want to remove this posting?")) return;
    
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`/api/internships/${postingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPostings((prev) => prev.filter((posting) => posting.id !== postingId));
      if (selectedPosting?.id === postingId) {
        closePostingModal();
      }
      toast.show("Posting removed");
    } catch (err) {
      console.error("Remove posting error:", err);
      toast.show("Failed to remove posting", "error");
    }
  };

  const savePostingEdits = async (e) => {
    e.preventDefault();

    const title = postingEditForm.title.trim();
    const location = postingEditForm.location.trim();
    const description = postingEditForm.description.trim();

    if (!selectedPosting) return;
    if (!title || !location || !description) {
      toast.show("Please complete all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.put(`/api/internships/${selectedPosting.id}`, {
        title,
        description,
        company: selectedPosting.company,
        location,
        setup: postingEditForm.setup,
        status: postingEditForm.status,
        startDate: selectedPosting.startDate,
        endDate: selectedPosting.endDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPostings((prev) =>
        prev.map((posting) =>
          posting.id === res.data.id ? res.data : posting
        )
      );

      setSelectedPosting(res.data);
      toast.show("Posting updated successfully");
      setIsPostingEditMode(false);
    } catch (err) {
      console.error("Edit posting error:", err);
      toast.show("Failed to update posting", "error");
    }
  };

  const updateApplicantStatus = async (applicantId, nextStatus) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.put(`/api/applications/${applicantId}/status?status=${nextStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setApplicants((prev) =>
        prev.map((applicant) =>
          applicant.id === applicantId ? { ...applicant, status: nextStatus } : applicant
        )
      );
      toast.show(`Applicant status updated to ${nextStatus}`);
      // Refresh postings to sync applicant counts
      fetchMyPostings();
    } catch (err) {
      console.error("Status update error:", err);
      toast.show(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile({
      name: form.name,
      email: form.email,
      companyName: form.companyName,
      companyLocation: form.companyLocation,
      companyWebsite: form.companyWebsite,
    });
    setStatus(res.ok ? "Profile updated." : res.message || "Update failed.");
    if (res.ok) {
      toast.show("Employer Profile Saved");
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setStatus("");
      }, 700);
    }
  };

  return (
    <DashboardLayout 
      title="Employer Dashboard"
      onNotificationClick={openNotifications}
      notificationCount={notifications.filter(n => !n.read).length}
    >
      <div className="student-dashboard-wrapper">
        {/* Hero Section */}
        <section className="student-hero">
          <div className="hero-aurora-bg">
            <div className="blob one"></div>
            <div className="blob two"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">Employer Portal</span>
              <h1>Manage your Talent Pipeline, {currentUser?.name?.split(" ")[0] || "Employer"}! 👋</h1>
              <p>Post new internship opportunities, review applicants, and connect with the next generation of professionals.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{activePostingsCount}</span>
                <span className="lab">Active Jobs</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{newApplicantsCount}</span>
                <span className="lab">New Applicants</span>
              </div>
            </div>
          </div>
        </section>

        <div className="student-bento-grid">
          {/* Employer Profile Bento */}
          <section className="bento-card employer-profile-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Company Profile</span>
                <h3>{currentUser?.companyName || "Your Company"}</h3>
              </div>
              <button className="edit-btn-glass" onClick={openProfileModal}>Edit</button>
            </div>
            
            <div className="profile-details-mini">
              <div className="mini-item">
                <label>Contact</label>
                <p>{currentUser?.name}</p>
              </div>
              <div className="mini-item">
                <label>Email</label>
                <p>{currentUser?.email}</p>
              </div>
              <div className="mini-item">
                <label>Location</label>
                <p>{currentUser?.companyLocation || "Not set"}</p>
              </div>
              {currentUser?.companyWebsite && (
                <div className="mini-item">
                  <label>Website</label>
                  <p>{currentUser?.companyWebsite}</p>
                </div>
              )}
            </div>

            <div className="completion-row">
              <div style={{ width: "100%" }}>
                <div className="completion-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>Profile Completion</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{profileCompletion}%</strong>
                </div>
                <div className="completion-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div className="completion-fill" style={{ width: `${profileCompletion}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
            </div>
          </section>

          {/* Employer Quick Stats Bento */}
          <section className="bento-card employer-stats-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Overview</span>
                <h3>Performance Pulse</h3>
              </div>
            </div>
            
            <div className="stats-mini-grid">
              <div className="stat-mini-box">
                <span className="v">{postings.length}</span>
                <span className="l">Total Postings</span>
              </div>
              <div className="stat-mini-box">
                <span className="v">{applicants.length}</span>
                <span className="l">Applications</span>
              </div>
              <div className="stat-mini-box">
                <span className="v">{shortlistedApplicantsCount}</span>
                <span className="l">Shortlisted</span>
              </div>
            </div>

            <div className="insight-callout-pro" style={{ marginTop: '24px' }}>
              <div className="insight-icon">📈</div>
              <p className="insight-text">
                Your listings have reached <strong>{applicants.length * 12}</strong> potential students this week.
              </p>
            </div>
          </section>

          {/* Market Trends Bento */}
          <section className="bento-card trends-bento">
            <JobTrendsWidget />
          </section>

          {/* Connections Bento */}
          <section className="bento-card connections-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Networking</span>
                <h3>Talent Network</h3>
              </div>
              <button className="edit-btn-glass" onClick={() => setIsFriendsModalOpen(true)}>View All ({friends.length})</button>
            </div>
            
            <div className="pending-requests-section" style={{ marginTop: '1rem' }}>
              {pendingRequests.length > 0 && (
                <div className="pending-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>PENDING REQUESTS</span>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="request-card-mini" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{req.requesterName}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>{req.requesterRole}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => respondToRequest(req.id, 'ACCEPTED')} style={{ background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>Accept</button>
                        <button onClick={() => respondToRequest(req.id, 'DECLINED')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="friends-preview" style={{ marginTop: pendingRequests.length > 0 ? '1.5rem' : '0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px' }}>KEY CONNECTIONS</span>
                <div className="friends-avatars" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {friends.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>No connections yet. Connect with students in the ecosystem!</p>
                  ) : (
                    friends.slice(0, 5).map(friend => (
                      <div key={friend.id} className="friend-avatar-circle" title={friend.name} style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.1)' }}>
                        {friend.name.charAt(0)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Postings Bento */}
          <section className="bento-card employer-postings-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Management</span>
                <h3>My Internship Postings</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="app-filters-mini">
                  <input
                    type="text"
                    value={postingSearch}
                    onChange={(e) => setPostingSearch(e.target.value)}
                    placeholder="Search roles..."
                  />
                </div>
                <button className="btn-primary-pro" onClick={openCreatePostingModal}>+ New Posting</button>
              </div>
            </div>

            <div className="postings-grid-pro">
              {isLoading ? (
                <div className="market-status-overlay">
                  <div className="loading-pulse"><div className="pulse-dot"></div>Loading postings...</div>
                </div>
              ) : filteredPostings.length === 0 ? (
                <div className="market-status-overlay">
                  <p className="insight-text">No postings found. Start by creating one!</p>
                </div>
              ) : (
                filteredPostings.map((posting) => (
                  <div key={posting.id} className="posting-card-pro">
                    <span className={`card-tag ${posting.status === "ACTIVE" ? "active" : "closed"}`}>
                      {posting.status}
                    </span>
                    <div className="card-body-pro">
                      <h4>{posting.title}</h4>
                      <span className="loc">{posting.location} • {posting.setup}</span>
                      <div className="card-stats-row">
                        <div className="c-stat">Applicants: <b>{posting.applicants || 0}</b></div>
                      </div>
                    </div>
                    <div className="card-actions-pro">
                      <button className="edit-btn-glass" onClick={() => viewPosting(posting)}>View</button>
                      <button className="edit-btn-glass" onClick={() => cyclePostingStatus(posting.id)}>Toggle</button>
                      <button className="edit-btn-glass" style={{ color: '#ff6b6b' }} onClick={() => removePosting(posting.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Applicants Bento */}
          <section className="bento-card employer-applicants-bento">
            <div className="bento-header">
              <div>
                <span className="bento-label">Talent Pool</span>
                <h3>Recent Applicants</h3>
              </div>
              <div className="app-filters-mini">
                <input
                  type="text"
                  value={applicantSearch}
                  onChange={(e) => setApplicantSearch(e.target.value)}
                  placeholder="Search applicants..."
                />
                <select value={applicantStatusFilter} onChange={(e) => setApplicantStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="ACCEPTED">Accepted</option>
                </select>
              </div>
            </div>

            <div className="applicants-grid-pro">
              {filteredApplicants.length === 0 ? (
                <div className="market-status-overlay">
                  <p className="insight-text">No applicants to show.</p>
                </div>
              ) : (
                filteredApplicants.map((applicant) => (
                  <div key={applicant.id} className="applicant-card-pro">
                    <span className={`card-tag ${applicant.status.toLowerCase()}`}>
                      {applicant.status}
                    </span>
                    <div className="card-body-pro">
                      <h4>{applicant.name}</h4>
                      <span className="loc">Applying for: {applicant.internship}</span>
                      <div className="c-stat" style={{ marginBottom: '12px' }}>Applied: {applicant.dateApplied}</div>
                    </div>
                    <div className="card-actions-pro">
                      <button className="edit-btn-glass" onClick={() => openStudentProfile(applicant)}>View Profile</button>
                      {applicant.status === "PENDING" && (
                        <>
                          <button className="btn-primary-pro" style={{ padding: '6px' }} onClick={() => updateApplicantStatus(applicant.id, "SHORTLISTED")}>Shortlist</button>
                          <button className="btn-primary-pro" style={{ padding: '6px', background: '#39c6b8' }} onClick={() => updateApplicantStatus(applicant.id, "ACCEPTED")}>Accept</button>
                        </>
                      )}
                      {applicant.status === "SHORTLISTED" && (
                        <button className="btn-primary-pro" style={{ background: '#39c6b8' }} onClick={() => updateApplicantStatus(applicant.id, "ACCEPTED")}>Accept</button>
                      )}
                      <button className="edit-btn-glass" style={{ color: '#ff6b6b' }} onClick={() => updateApplicantStatus(applicant.id, "REJECTED")}>Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <h3>Edit Employer Profile</h3>
                <button className="close-btn-glass" onClick={closeProfileModal}>✕</button>
              </div>
              <div className="modal-body-pro">
                <form className="form-grid-pro" onSubmit={onSave}>
                  <div className="input-group-pro">
                    <label>Contact Name</label>
                    <input name="name" value={form.name} onChange={onChange} required />
                  </div>
                  <div className="input-group-pro">
                    <label>Contact Email</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} required />
                  </div>
                  <div className="input-group-pro">
                    <label>Company Name</label>
                    <input name="companyName" value={form.companyName} onChange={onChange} />
                  </div>
                  <div className="input-group-pro">
                    <label>Location</label>
                    <input name="companyLocation" value={form.companyLocation} onChange={onChange} />
                  </div>
                  <div className="input-group-pro full-width">
                    <label>Website</label>
                    <input name="companyWebsite" value={form.companyWebsite} onChange={onChange} />
                  </div>
                  <div className="modal-footer-pro full-width">
                    <button className="btn-secondary-glass" type="button" onClick={closeProfileModal}>Cancel</button>
                    <button className="btn-primary-pro" type="submit">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPostingModalOpen && selectedPosting && (
        <div className="modal-overlay">
          <div className="modal-content application-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-aurora-glow secondary"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Internship Management</span>
                  <h3>{isPostingEditMode ? "Update Opportunity" : "Opportunity Intelligence"}</h3>
                </div>
                <button className="close-btn-glass" onClick={closePostingModal}>✕</button>
              </div>
              <div className="modal-body-pro">
                {!isPostingEditMode ? (
                  <div className="app-details-grid-pro">
                    <div className="detail-card-mini">
                      <span className="label">Posting Title</span>
                      <p>{selectedPosting.title}</p>
                    </div>
                    <div className="detail-card-mini">
                      <span className="label">Work Environment</span>
                      <p>
                        <span className={`status-tag-v2 ${selectedPosting.setup.toLowerCase()}`} style={{ 
                          background: selectedPosting.setup === 'Remote' ? 'rgba(57, 198, 184, 0.1)' : 'rgba(255, 107, 74, 0.1)',
                          color: selectedPosting.setup === 'Remote' ? '#39c6b8' : 'var(--primary)',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}>
                          {selectedPosting.setup}
                        </span>
                      </p>
                    </div>
                    <div className="detail-card-mini">
                      <span className="label">Primary Location</span>
                      <p>{selectedPosting.location}</p>
                    </div>
                    <div className="detail-card-mini">
                      <span className="label">Current Status</span>
                      <p>
                        <span className={`status-tag-v2 ${selectedPosting.status.toLowerCase()}`} style={{ 
                          background: selectedPosting.status === 'ACTIVE' ? 'rgba(57, 198, 184, 0.1)' : 'rgba(255, 107, 74, 0.1)',
                          color: selectedPosting.status === 'ACTIVE' ? '#39c6b8' : 'var(--primary)',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}>
                          {selectedPosting.status}
                        </span>
                      </p>
                    </div>
                    <div className="detail-card-mini full-width">
                      <span className="label">Role Description & Requirements</span>
                      <div style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '20px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginTop: '10px'
                      }}>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', opacity: 0.9 }}>
                          {selectedPosting.description}
                        </p>
                      </div>
                    </div>
                    <div className="modal-footer-pro full-width">
                      <button className="btn-secondary-glass" onClick={() => removePosting(selectedPosting.id)} style={{ color: '#ff6b6b' }}>Delete Posting</button>
                      <button className="btn-primary-pro" onClick={openPostingEditMode}>Edit Details</button>
                    </div>
                  </div>
                ) : (
                  <form className="form-grid-pro" onSubmit={savePostingEdits}>
                    <div className="input-group-pro">
                      <label>Internship Title</label>
                      <input 
                        name="title" 
                        value={postingEditForm.title} 
                        onChange={onPostingEditFormChange} 
                        placeholder="e.g. Senior Frontend Intern"
                        required 
                      />
                    </div>
                    <div className="input-group-pro">
                      <label>Location</label>
                      <input 
                        name="location" 
                        value={postingEditForm.location} 
                        onChange={onPostingEditFormChange} 
                        placeholder="e.g. Manila, Philippines"
                        required 
                      />
                    </div>
                    <div className="input-group-pro">
                      <label>Work Setup</label>
                      <select 
                        name="setup" 
                        value={postingEditForm.setup} 
                        onChange={onPostingEditFormChange} 
                      >
                        <option value="Onsite">Onsite</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                    <div className="input-group-pro">
                      <label>Status</label>
                      <select 
                        name="status" 
                        value={postingEditForm.status} 
                        onChange={onPostingEditFormChange} 
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                        <option value="DRAFT">Draft</option>
                      </select>
                    </div>
                    <div className="input-group-pro full-width">
                      <label>Detailed Description</label>
                      <textarea 
                        name="description" 
                        value={postingEditForm.description} 
                        onChange={onPostingEditFormChange} 
                        placeholder="Detail the responsibilities, required skills, and what the student will learn..."
                        rows={5} 
                        required 
                      />
                    </div>
                    <div className="modal-footer-pro full-width">
                      <button className="btn-secondary-glass" type="button" onClick={() => setIsPostingEditMode(false)}>Discard Changes</button>
                      <button className="btn-primary-pro" type="submit">Update Posting</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatePostingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content application-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">New Opportunity</span>
                  <h3>Broadcast Internship</h3>
                </div>
                <button className="close-btn-glass" onClick={closeCreatePostingModal}>✕</button>
              </div>
              <div className="modal-body-pro">
                {createPostingError && (
                  <div style={{ 
                    background: 'rgba(255, 107, 74, 0.1)', 
                    color: 'var(--primary)', 
                    padding: '12px 20px', 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255, 107, 74, 0.2)'
                  }}>
                    ⚠️ {createPostingError}
                  </div>
                )}
                <form className="form-grid-pro" onSubmit={submitNewPosting}>
                  <div className="input-group-pro">
                    <label>Internship Title</label>
                    <input name="title" value={postingForm.title} onChange={onPostingFormChange} placeholder="e.g., Backend Developer Intern" required />
                  </div>
                  <div className="input-group-pro">
                    <label>Location</label>
                    <input name="location" value={postingForm.location} onChange={onPostingFormChange} placeholder="e.g., Cebu, PH" required />
                  </div>
                  <div className="input-group-pro">
                    <label>Work Setup</label>
                    <select 
                      name="setup" 
                      value={postingForm.setup} 
                      onChange={onPostingFormChange} 
                    >
                      <option value="Onsite">Onsite</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div className="input-group-pro">
                    <label>Initial Status</label>
                    <select 
                      name="status" 
                      value={postingForm.status} 
                      onChange={onPostingFormChange} 
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                  <div className="input-group-pro full-width">
                    <label>Detailed Description</label>
                    <textarea 
                      name="description" 
                      value={postingForm.description} 
                      onChange={onPostingFormChange} 
                      rows={5} 
                      placeholder="Clearly define the role, expectations, and necessary technical stack..." 
                      required 
                    />
                  </div>
                  <div className="modal-footer-pro full-width">
                    <button className="btn-secondary-glass" type="button" onClick={closeCreatePostingModal}>Cancel</button>
                    <button className="btn-primary-pro" type="submit">Publish Opportunity</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {isFriendsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Network</span>
                  <h3>Talent Connections</h3>
                </div>
                <button className="close-btn-glass" onClick={() => setIsFriendsModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body-pro">
                <div className="friends-list-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {friends.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: 'var(--muted)' }}>No connections found.</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div key={friend.id} className="friend-card-pro" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                          {friend.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem' }}>{friend.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{friend.role}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{friend.companyName || friend.program}</p>
                        </div>
                        <button 
                          className="btn-primary-pro" 
                          style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                          onClick={() => {
                            openChatWith(friend);
                            setIsFriendsModalOpen(false);
                          }}
                        >
                          Chat
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer-pro">
                <button className="btn-secondary-glass" onClick={() => setIsFriendsModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {isStudentProfileModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Applicant Profile</span>
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
                <button className="close-btn-glass" onClick={() => setIsStudentProfileModalOpen(false)}>✕</button>
              </div>
              
              <div className="modal-body-pro" style={{ minHeight: '300px' }}>
                {studentProfileTab === 'essentials' && (
                  <div className="profile-details-mini" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                    <div className="profile-meta-row" style={{ display: 'flex', gap: '30px', marginBottom: '24px' }}>
                      <div className="mini-item">
                        <label>Program / Course</label>
                        <p style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{selectedStudent.studentProgram || "N/A"}</p>
                      </div>
                      <div className="mini-item">
                        <label>Year Level</label>
                        <p style={{ fontSize: '1.2rem' }}>{selectedStudent.studentYearLevel || "Not specified"}</p>
                      </div>
                    </div>

                    {selectedStudent.studentResumeUrl && (
                      <div className="mini-item" style={{ marginBottom: '24px' }}>
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
                          📄 View Candidate Resume (PDF)
                        </a>
                      </div>
                    )}

                    <div className="mini-item">
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
                <button className="btn-secondary-glass" onClick={() => setIsStudentProfileModalOpen(false)}>Close Profile</button>
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
                    <button className="btn-primary-pro" style={{ background: '#39c6b8' }} onClick={() => toast.show("Check your talent network requests!")}>
                      📩 Review Request
                    </button>
                  )}
                  {connectionStatus === "ACCEPTED" && (
                    <button className="btn-secondary-glass" disabled style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                      🤝 Connected
                    </button>
                  )}
                  <button className="btn-secondary-glass" style={{ borderColor: 'rgba(57, 198, 184, 0.3)', color: '#39c6b8' }} onClick={() => openChatWith(selectedStudent)}>💬 Message Student</button>
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