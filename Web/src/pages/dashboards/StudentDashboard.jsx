import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DEFAULT_APPLICATIONS = [
  {
    id: 1,
    internship: "Web Developer Intern",
    company: "ABC Corp",
    location: "Cebu, PH",
    setup: "Hybrid",
    dateApplied: "2026-03-12",
    status: "PENDING",
    studentNote: "Waiting for technical exam schedule.",
  },
  {
    id: 2,
    internship: "IT Support Intern",
    company: "XYZ Solutions",
    location: "Makati, PH",
    setup: "Onsite",
    dateApplied: "2026-02-28",
    status: "ACCEPTED",
    studentNote: "Submitted requirements and signed acceptance.",
  },
  {
    id: 3,
    internship: "QA Intern",
    company: "Skyline Tech",
    location: "Remote",
    setup: "Remote",
    dateApplied: "2026-03-18",
    status: "REJECTED",
    studentNote: "Will apply again next intake.",
  },
  {
    id: 4,
    internship: "Data Analyst Intern",
    company: "Insight Labs",
    location: "Taguig, PH",
    setup: "Hybrid",
    dateApplied: "2026-04-01",
    status: "PENDING",
    studentNote: "Interview completed, awaiting result.",
  },
];

export default function StudentDashboard() {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const toast = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [applications, setApplications] = useState(DEFAULT_APPLICATIONS);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    program: currentUser?.program || "",
    yearLevel: currentUser?.yearLevel || "",
    skills: currentUser?.skills || "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      program: currentUser?.program || "",
      yearLevel: currentUser?.yearLevel || "",
      skills: currentUser?.skills || "",
    }));
  }, [currentUser]);

  const normalizedSearch = applicationSearch.trim().toLowerCase();
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      app.internship.toLowerCase().includes(normalizedSearch) ||
      app.company.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  const totalApplications = applications.length;
  const pendingApplications = applications.filter((app) => app.status === "PENDING").length;
  const acceptedApplications = applications.filter((app) => app.status === "ACCEPTED").length;
  const completedApplications = applications.filter(
    (app) => app.status === "ACCEPTED" || app.status === "REJECTED" || app.status === "WITHDRAWN"
  ).length;

  const profileFields = [
    currentUser?.name,
    currentUser?.email,
    currentUser?.program,
    currentUser?.yearLevel,
    currentUser?.skills,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter((field) => !!String(field || "").trim()).length / profileFields.length) * 100
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openProfileModal = () => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      program: currentUser?.program || "",
      yearLevel: currentUser?.yearLevel || "",
      skills: currentUser?.skills || "",
    });
    setStatus("");
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const clearApplicationFilters = () => {
    setApplicationSearch("");
    setStatusFilter("ALL");
  };

  const openApplicationModal = (application) => {
    setSelectedApplication(application);
    setIsApplicationModalOpen(true);
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setIsApplicationModalOpen(false);
  };

  const withdrawApplication = (applicationId) => {
    setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    if (selectedApplication?.id === applicationId) {
      closeApplicationModal();
    }
    toast.show("Application removed");
  };

  const onSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile({
      name: form.name,
      email: form.email,
      program: form.program,
      yearLevel: form.yearLevel,
      skills: form.skills,
    });
    setStatus(res.ok ? "Profile updated." : res.message || "Update failed.");
    if (res.ok) {
      toast.show("Student Profile Saved");
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setStatus("");
      }, 700);
    }
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <section className="card">
        <div className="section-title-row">
          <h3>My Profile</h3>
          <button className="action-btn" type="button" onClick={openProfileModal}>
            Edit Profile
          </button>
        </div>
        <div className="profile-overview-grid">
          <div>
            <span className="profile-label">Name</span>
            <p>{currentUser?.name || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Email</span>
            <p>{currentUser?.email || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Program</span>
            <p>{currentUser?.program || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Year Level</span>
            <p>{currentUser?.yearLevel || "Not set"}</p>
          </div>
          <div>
            <span className="profile-label">Skills</span>
            <p>{currentUser?.skills || "Not set"}</p>
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
        <h3>Application Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Applications</span>
            <span className="stat-value">{totalApplications}</span>
            <span className="stat-trend">All submitted internships</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{pendingApplications}</span>
            <span className="stat-trend">Waiting for review</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Accepted</span>
            <span className="stat-value">{acceptedApplications}</span>
            <span className="stat-trend positive">Congratulations</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completedApplications}</span>
            <span className="stat-trend">Final decision received</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h3>My Applications</h3>
          <div className="toolbar-actions">
            <span className="results-count">{filteredApplications.length} result(s)</span>
            <button type="button" className="action-btn" onClick={clearApplicationFilters}>Clear Filters</button>
          </div>
        </div>
        <div className="applications-toolbar">
          <input
            type="text"
            value={applicationSearch}
            onChange={(e) => setApplicationSearch(e.target.value)}
            placeholder="Search by internship or company"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Internship</th>
              <th>Company</th>
              <th>Date Applied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">
                  No applications match your search/filter.
                </td>
              </tr>
            )}
            {filteredApplications.map((application) => (
              <tr key={application.id}>
                <td>{application.internship}</td>
                <td>{application.company}</td>
                <td>{application.dateApplied}</td>
                <td>
                  <span className={`status ${application.status.toLowerCase()}`}>
                    {application.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="action-btn small"
                      onClick={() => openApplicationModal(application)}
                    >
                      View
                    </button>
                    {["PENDING", "REJECTED"].includes(application.status) && (
                      <button
                        type="button"
                        className="action-btn small danger"
                        onClick={() => withdrawApplication(application.id)}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isProfileModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit student profile">
          <div className="modal-panel">
            <div className="section-title-row">
              <h3>Edit Student Profile</h3>
              <button className="action-btn" type="button" onClick={closeProfileModal}>
                Close
              </button>
            </div>
            <form className="profile-form" onSubmit={onSave}>
              <div className="profile-grid">
                <label>
                  Full Name
                  <input name="name" value={form.name} onChange={onChange} required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" value={form.email} onChange={onChange} required />
                </label>
                <label>
                  Program
                  <input name="program" value={form.program} onChange={onChange} placeholder="BSIT" />
                </label>
                <label>
                  Year Level
                  <input name="yearLevel" value={form.yearLevel} onChange={onChange} placeholder="3rd Year" />
                </label>
                <label>
                  Skills
                  <input name="skills" value={form.skills} onChange={onChange} placeholder="Java, React, SQL" />
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

      {isApplicationModalOpen && selectedApplication && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Application details">
          <div className="modal-panel">
            <div className="section-title-row">
              <h3>Application Details</h3>
              <button className="action-btn" type="button" onClick={closeApplicationModal}>
                Close
              </button>
            </div>
            <div className="application-details-grid">
              <div>
                <span className="profile-label">Internship</span>
                <p>{selectedApplication.internship}</p>
              </div>
              <div>
                <span className="profile-label">Company</span>
                <p>{selectedApplication.company}</p>
              </div>
              <div>
                <span className="profile-label">Location</span>
                <p>{selectedApplication.location}</p>
              </div>
              <div>
                <span className="profile-label">Setup</span>
                <p>{selectedApplication.setup}</p>
              </div>
              <div>
                <span className="profile-label">Date Applied</span>
                <p>{selectedApplication.dateApplied}</p>
              </div>
              <div>
                <span className="profile-label">Status</span>
                <p>
                  <span className={`status ${selectedApplication.status.toLowerCase()}`}>
                    {selectedApplication.status}
                  </span>
                </p>
              </div>
              <div className="application-note-block">
                <span className="profile-label">Student Note</span>
                <p>{selectedApplication.studentNote || "No note available."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
