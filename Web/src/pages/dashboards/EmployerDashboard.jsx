import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DEFAULT_POSTINGS = [
  {
    id: 1,
    title: "Frontend Developer Intern",
    location: "Makati, PH",
    setup: "Hybrid",
    postedAt: "2026-04-08",
    applicants: 8,
    status: "OPEN",
    description: "Assist with React UI implementation and QA support.",
  },
  {
    id: 2,
    title: "IT Support Intern",
    location: "Cebu, PH",
    setup: "Onsite",
    postedAt: "2026-03-28",
    applicants: 6,
    status: "CLOSED",
    description: "Help with hardware setup and internal ticket resolution.",
  },
  {
    id: 3,
    title: "Data Analyst Intern",
    location: "Remote",
    setup: "Remote",
    postedAt: "2026-04-11",
    applicants: 4,
    status: "DRAFT",
    description: "Build weekly data dashboards and KPI reports.",
  },
];

const DEFAULT_APPLICANTS = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    internship: "Frontend Developer Intern",
    dateApplied: "2026-04-10",
    status: "PENDING",
    note: "Strong React portfolio.",
  },
  {
    id: 2,
    name: "Maria Santos",
    internship: "IT Support Intern",
    dateApplied: "2026-04-07",
    status: "ACCEPTED",
    note: "Completed interview and accepted.",
  },
  {
    id: 3,
    name: "Paolo Reyes",
    internship: "Data Analyst Intern",
    dateApplied: "2026-04-09",
    status: "REJECTED",
    note: "Insufficient SQL experience.",
  },
  {
    id: 4,
    name: "Alyssa Tan",
    internship: "Frontend Developer Intern",
    dateApplied: "2026-04-12",
    status: "SHORTLISTED",
    note: "Proceed to final panel interview.",
  },
];

const INITIAL_POSTING_FORM = {
  title: "",
  location: "",
  setup: "Hybrid",
  status: "OPEN",
  description: "",
};

export default function EmployerDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const toast = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [isCreatePostingModalOpen, setIsCreatePostingModalOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [postingSearch, setPostingSearch] = useState("");
  const [postingStatusFilter, setPostingStatusFilter] = useState("ALL");
  const [applicantSearch, setApplicantSearch] = useState("");
  const [applicantStatusFilter, setApplicantStatusFilter] = useState("ALL");
  const [postings, setPostings] = useState(DEFAULT_POSTINGS);
  const [applicants, setApplicants] = useState(DEFAULT_APPLICANTS);
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

  useEffect(() => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      companyName: currentUser?.companyName || "",
      companyLocation: currentUser?.companyLocation || "",
      companyWebsite: currentUser?.companyWebsite || "",
    });
  }, [currentUser]);

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

  const activePostings = postings.filter((p) => p.status === "OPEN").length;
  const newApplicants = applicants.filter((a) => a.status === "PENDING").length;
  const shortlistedApplicants = applicants.filter((a) => a.status === "SHORTLISTED").length;

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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPostingFormChange = (e) => {
    const { name, value } = e.target;
    setPostingForm((prev) => ({ ...prev, [name]: value }));
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
    setIsPostingModalOpen(true);
  };

  const closePostingModal = () => {
    setSelectedPosting(null);
    setIsPostingModalOpen(false);
  };

  const cyclePostingStatus = (postingId) => {
    setPostings((prev) =>
      prev.map((posting) => {
        if (posting.id !== postingId) return posting;
        if (posting.status === "OPEN") return { ...posting, status: "CLOSED" };
        if (posting.status === "CLOSED") return { ...posting, status: "OPEN" };
        return { ...posting, status: "OPEN" };
      })
    );
    toast.show("Posting status updated");
  };

  const removePosting = (postingId) => {
    setPostings((prev) => prev.filter((posting) => posting.id !== postingId));
    if (selectedPosting?.id === postingId) {
      closePostingModal();
    }
    toast.show("Posting removed");
  };

  const updateApplicantStatus = (applicantId, nextStatus) => {
    setApplicants((prev) =>
      prev.map((applicant) =>
        applicant.id === applicantId ? { ...applicant, status: nextStatus } : applicant
      )
    );
    toast.show("Applicant status updated");
  };

  const submitNewPosting = (e) => {
    e.preventDefault();
    setCreatePostingError("");

    const title = postingForm.title.trim();
    const location = postingForm.location.trim();
    const description = postingForm.description.trim();

    if (!title || !location || !description) {
      setCreatePostingError("Please fill out all required fields.");
      return;
    }

    const newPosting = {
      id: Date.now(),
      title,
      location,
      setup: postingForm.setup,
      postedAt: new Date().toISOString().slice(0, 10),
      applicants: 0,
      status: postingForm.status,
      description,
    };

    setPostings((prev) => [newPosting, ...prev]);
    setPostingSearch("");
    setPostingStatusFilter("ALL");
    setIsCreatePostingModalOpen(false);
    setPostingForm(INITIAL_POSTING_FORM);
    toast.show("Internship posted successfully");
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

      <section className="card">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Active Postings</span>
            <span className="stat-value">{activePostings}</span>
            <span className="stat-trend positive">Currently open listings</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Applicants</span>
            <span className="stat-value">{newApplicants}</span>
            <span className="stat-trend">Need review</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Shortlisted</span>
            <span className="stat-value">{shortlistedApplicants}</span>
            <span className="stat-trend">Ready for next step</span>
          </div>
        </div>
      </section>

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
            <option value="OPEN">Open</option>
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
            {filteredPostings.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">No postings match your search/filter.</td>
              </tr>
            )}
            {filteredPostings.map((posting) => (
              <tr key={posting.id}>
                <td>{posting.title}</td>
                <td>{posting.location}</td>
                <td>{posting.applicants}</td>
                <td>
                  <span className={`chip ${posting.status === "OPEN" ? "chip-open" : posting.status === "CLOSED" ? "chip-closed" : "chip-draft"}`}>
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
            ))}
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
                        <button className="action-btn small danger" type="button" onClick={() => updateApplicantStatus(applicant.id, "REJECTED")}>Reject</button>
                      </>
                    )}
                    {applicant.status === "SHORTLISTED" && (
                      <button className="action-btn small" type="button" onClick={() => updateApplicantStatus(applicant.id, "ACCEPTED")}>Accept</button>
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
              <h3>Posting Details</h3>
              <button className="action-btn" type="button" onClick={closePostingModal}>Close</button>
            </div>
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
                <p>{selectedPosting.postedAt}</p>
              </div>
              <div>
                <span className="profile-label">Applicants</span>
                <p>{selectedPosting.applicants}</p>
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
                    <option value="OPEN">Open</option>
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
