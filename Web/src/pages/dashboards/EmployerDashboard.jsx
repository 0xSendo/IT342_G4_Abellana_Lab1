import { useContext, useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import JobTrendsWidget from "../../components/JobTrendsWidget";

const INITIAL_POSTING_FORM = {
  title: "",
  location: "",
  setup: "Hybrid",
  status: "ACTIVE",
  description: "",
};

export default function EmployerDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const toast = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [isCreatePostingModalOpen, setIsCreatePostingModalOpen] = useState(false);
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

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

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
          note: "New application received via portal."
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
    const interval = setInterval(fetchNotifications, 30000);
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
    <DashboardLayout title="Employer Dashboard">
      <section className="card">
        <div className="section-title-row">
          <h3>Employer Profile</h3>
          <button className="action-btn" type="button" onClick={openProfileModal}>
            Edit Profile
          </button>
        </div>
        <div className="profile-overview-grid">
          <div>
            <span className="profile-label">Contact Name</span>
            <p>{currentUser?.name || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Contact Email</span>
            <p>{currentUser?.email || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Company Name</span>
            <p>{currentUser?.companyName || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Location</span>
            <p>{currentUser?.companyLocation || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Website</span>
            <p>{currentUser?.companyWebsite || "Not set"}</p>
          </div>
        </div>
        <div className="completion-row">
          <span className="profile-label">Profile Completion</span>
          <strong>{profileCompletion}%</strong>
        </div>
        <div className="completion-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={profileCompletion}>
          <div className="completion-fill" style={{ width: `${profileCompletion}%` }} />
        </div>
      </section>

      {/* Overview Section */}
      <section className="card">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Active Postings</span>
            <span className="stat-value">{activePostingsCount}</span>
            <span className="stat-trend positive">Currently open listings</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Applicants</span>
            <span className="stat-value">{newApplicantsCount}</span>
            <span className="stat-trend">Need review</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Shortlisted</span>
            <span className="stat-value">{shortlistedApplicantsCount}</span>
            <span className="stat-trend">Ready for next step</span>
          </div>
        </div>
      </section>

      {/* Market Trends Section */}
      <JobTrendsWidget />

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <section className="card">
          <div className="section-title-row">
            <h3>🔔 System Notifications</h3>
            <button className="action-btn small" onClick={() => fetchNotifications()}>Refresh</button>
          </div>
          <div className="student-notification-list">
            {notifications.map((n) => (
              <article key={n.id} className={`student-notification-item ${n.read ? "read" : "unread"}`}>
                <div className="notif-content">
                  <p className="student-notification-title">{n.title}</p>
                  <p className="student-notification-message">{n.message}</p>
                  <span className="feed-muted">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="section-title-row">
          <h3>My Internship Postings</h3>
          <div className="toolbar-actions">
            <span className="results-count">{filteredPostings.length} result(s)</span>
            <button className="action-btn" type="button" onClick={clearPostingFilters}>Clear Filters</button>
          </div>
        </div>
        <div className="applications-toolbar">
          <input
            type="text"
            value={postingSearch}
            onChange={(e) => setPostingSearch(e.target.value)}
            placeholder="Search by role or location"
          />
          <select value={postingStatusFilter} onChange={(e) => setPostingStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <div className="action-row">
          <button className="primary-btn" type="button" onClick={openCreatePostingModal}>Post New Internship</button>
          <button className="action-btn" type="button" onClick={() => toast.show("Bulk manage coming next")}>Manage Listings</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Location</th>
              <th>Applicants</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="empty-row">Loading postings...</td></tr>
            ) : filteredPostings.length === 0 ? (
              <tr><td colSpan="5" className="empty-row">No postings match your search/filter.</td></tr>
            ) : (
              filteredPostings.map((posting) => (
                <tr key={posting.id}>
                  <td>{posting.title}</td>
                  <td>{posting.location}</td>
                  <td>{posting.applicants || 0}</td>
                  <td>
                    <span className={`chip ${posting.status === "ACTIVE" ? "chip-open" : posting.status === "CLOSED" ? "chip-closed" : "chip-draft"}`}>
                      {posting.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn small" type="button" onClick={() => viewPosting(posting)}>View</button>
                      <button className="action-btn small" type="button" onClick={() => cyclePostingStatus(posting.id)}>Toggle</button>
                      <button className="action-btn small danger" type="button" onClick={() => removePosting(posting.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h3>Recent Applicants</h3>
          <div className="toolbar-actions">
            <span className="results-count">{filteredApplicants.length} result(s)</span>
            <button className="action-btn" type="button" onClick={clearApplicantFilters}>Clear Filters</button>
          </div>
        </div>
        <div className="applications-toolbar">
          <input
            type="text"
            value={applicantSearch}
            onChange={(e) => setApplicantSearch(e.target.value)}
            placeholder="Search by student or internship"
          />
          <select value={applicantStatusFilter} onChange={(e) => setApplicantStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Internship</th>
              <th>Date Applied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">No applicants match your search/filter.</td>
              </tr>
            )}
            {filteredApplicants.map((applicant) => (
              <tr key={applicant.id}>
                <td>{applicant.name}</td>
                <td>{applicant.internship}</td>
                <td>{applicant.dateApplied}</td>
                <td><span className={`status ${applicant.status.toLowerCase()}`}>{applicant.status}</span></td>
                <td>
                  <div className="table-actions">
                    {applicant.status === "PENDING" && (
                      <>
                        <button className="action-btn small" type="button" onClick={() => updateApplicantStatus(applicant.id, "SHORTLISTED")}>Shortlist</button>
                        <button className="action-btn small" type="button" onClick={() => updateApplicantStatus(applicant.id, "ACCEPTED")}>Accept</button>
                        <button className="action-btn small danger" type="button" onClick={() => updateApplicantStatus(applicant.id, "REJECTED")}>Reject</button>
                      </>
                    )}
                    {applicant.status === "SHORTLISTED" && (
                      <>
                        <button className="action-btn small" type="button" onClick={() => updateApplicantStatus(applicant.id, "ACCEPTED")}>Accept</button>
                        <button className="action-btn small danger" type="button" onClick={() => updateApplicantStatus(applicant.id, "REJECTED")}>Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isProfileModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit employer profile">
          <div className="modal-panel">
            <div className="section-title-row">
              <h3>Edit Employer Profile</h3>
              <button className="action-btn" type="button" onClick={closeProfileModal}>Close</button>
            </div>
            <form className="profile-form" onSubmit={onSave}>
              <div className="profile-grid">
                <label>
                  Contact Name
                  <input name="name" value={form.name} onChange={onChange} required />
                </label>
                <label>
                  Contact Email
                  <input name="email" type="email" value={form.email} onChange={onChange} required />
                </label>
                <label>
                  Company Name
                  <input name="companyName" value={form.companyName} onChange={onChange} placeholder="InternMatch Inc." />
                </label>
                <label>
                  Location
                  <input name="companyLocation" value={form.companyLocation} onChange={onChange} placeholder="Cebu, PH" />
                </label>
                <label>
                  Website
                  <input name="companyWebsite" value={form.companyWebsite} onChange={onChange} placeholder="https://" />
                </label>
              </div>
              <div className="profile-actions">
                <button className="primary-btn" type="submit">Save Profile</button>
                {status && <span className="profile-status">{status}</span>}
              </div>
            </form>
          </div>
        </div>
      )}

      {isPostingModalOpen && selectedPosting && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Posting details">
          <div className="modal-panel">
            <div className="section-title-row">
              <h3>{isPostingEditMode ? "Edit Posting" : "Posting Details"}</h3>
              <button className="action-btn" type="button" onClick={closePostingModal}>Close</button>
            </div>
            {!isPostingEditMode ? (
              <>
                <div className="application-details-grid">
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
                    <span className="profile-label">Date Posted</span>
                    <p>{selectedPosting.postedAt || selectedPosting.createdAt}</p>
                  </div>
                  <div>
                    <span className="profile-label">Applicants</span>
                    <p>{selectedPosting.applicants || 0}</p>
                  </div>
                  <div>
                    <span className="profile-label">Status</span>
                    <p>{selectedPosting.status}</p>
                  </div>
                  <div className="application-note-block">
                    <span className="profile-label">Description</span>
                    <p>{selectedPosting.description}</p>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="primary-btn" type="button" onClick={openPostingEditMode}>Edit Posting</button>
                </div>
              </>
            ) : (
              <form className="profile-form" onSubmit={savePostingEdits}>
                <div className="profile-grid">
                  <label>
                    Internship Title
                    <input
                      name="title"
                      value={postingEditForm.title}
                      onChange={onPostingEditFormChange}
                      required
                    />
                  </label>
                  <label>
                    Location
                    <input
                      name="location"
                      value={postingEditForm.location}
                      onChange={onPostingEditFormChange}
                      required
                    />
                  </label>
                  <label>
                    Work Setup
                    <select name="setup" value={postingEditForm.setup} onChange={onPostingEditFormChange}>
                      <option value="Onsite">Onsite</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </label>
                  <label>
                    Posting Status
                    <select name="status" value={postingEditForm.status} onChange={onPostingEditFormChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="CLOSED">Closed</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </label>
                  <label className="modal-full-width">
                    Description
                    <textarea
                      name="description"
                      value={postingEditForm.description}
                      onChange={onPostingEditFormChange}
                      rows={4}
                      required
                    />
                  </label>
                </div>

                <div className="profile-actions">
                  <button className="primary-btn" type="submit">Save Changes</button>
                  <button className="action-btn" type="button" onClick={() => setIsPostingEditMode(false)}>
                    Cancel Edit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isCreatePostingModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Post new internship">
          <div className="modal-panel">
            <div className="section-title-row">
              <h3>Post New Internship</h3>
              <button className="action-btn" type="button" onClick={closeCreatePostingModal}>Close</button>
            </div>

            <form className="profile-form" onSubmit={submitNewPosting}>
              <div className="profile-grid">
                <label>
                  Internship Title
                  <input
                    name="title"
                    value={postingForm.title}
                    onChange={onPostingFormChange}
                    placeholder="e.g., Backend Developer Intern"
                    required
                  />
                </label>
                <label>
                  Location
                  <input
                    name="location"
                    value={postingForm.location}
                    onChange={onPostingFormChange}
                    placeholder="e.g., Cebu, PH"
                    required
                  />
                </label>
                <label>
                  Work Setup
                  <select name="setup" value={postingForm.setup} onChange={onPostingFormChange}>
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </label>
                <label>
                  Posting Status
                  <select name="status" value={postingForm.status} onChange={onPostingFormChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </label>
                <label className="modal-full-width">
                  Description
                  <textarea
                    name="description"
                    value={postingForm.description}
                    onChange={onPostingFormChange}
                    placeholder="Briefly describe responsibilities and requirements"
                    rows={4}
                    required
                  />
                </label>
              </div>

              <div className="profile-actions">
                <button className="primary-btn" type="submit">Post Internship</button>
                {createPostingError && <span className="profile-status">{createPostingError}</span>}
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}