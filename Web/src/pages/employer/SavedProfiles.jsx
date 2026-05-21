import { useState, useEffect, useContext } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useChat } from "../../context/ChatContext";
import { useNotifications } from "../../context/NotificationContext";
import "../../styles/common/bento.css";
import "../../styles/employer/employer-dashboard.css";

export default function SavedProfiles() {
  const { currentUser } = useContext(AuthContext);
  const { openChatWith } = useChat();
  const toast = useToast();
  const { unreadCount, openNotifications } = useNotifications();
  
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [studentProfileTab, setStudentProfileTab] = useState("essentials");
  const [connectionStatus, setConnectionStatus] = useState("NONE");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchSavedProfiles = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get(`${API_BASE}/api/saved-profiles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedProfiles(res.data || []);
    } catch (err) {
      console.error("Failed to fetch saved profiles", err);
      toast.show("Failed to load saved profiles", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedProfiles();
  }, []);

  const unsaveProfile = async (studentId) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`${API_BASE}/api/saved-profiles/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedProfiles(prev => prev.filter(p => p.studentId !== studentId));
      toast.show("Profile removed from saved list.");
      if (selectedStudent?.studentId === studentId) {
        setIsProfileModalOpen(false);
      }
    } catch (err) {
      console.error("Unsave error", err);
      toast.show("Failed to remove profile", "error");
    }
  };

  const fetchConnectionStatus = async (studentId) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      const res = await axios.get(`${API_BASE}/api/connections/status/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionStatus(res.data.status);
    } catch (err) {
      console.error("Failed to fetch connection status", err);
    }
  };

  const openStudentProfile = (profile) => {
    setSelectedStudent(profile);
    setStudentProfileTab("essentials");
    setIsProfileModalOpen(true);
    if (profile.studentId) {
      fetchConnectionStatus(profile.studentId);
    }
  };

  return (
    <DashboardLayout 
      title="Saved Talent"
      onNotificationClick={openNotifications}
      notificationCount={unreadCount}
    >
      <div className="employer-dashboard-wrapper" style={{ padding: '2rem' }}>
        <section className="student-hero">
          <div className="hero-aurora-bg">
            <div className="blob one"></div>
            <div className="blob two"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">Talent Management</span>
              <h1>Your Bookmarked <span className="gradient-text">Talent</span> ⭐</h1>
              <p>Review and manage the student profiles you've saved for future opportunities.</p>
            </div>
          </div>
        </section>

        <div className="bento-card" style={{ marginTop: '2rem' }}>
          <div className="bento-header">
            <div>
              <span className="bento-label">Repository</span>
              <h3>Bookmarked Students ({savedProfiles.length})</h3>
            </div>
          </div>

          <div className="postings-grid-pro" style={{ marginTop: '1.5rem' }}>
            {isLoading ? (
              <div className="market-status-overlay">
                <div className="loading-pulse">Analyzing saved talent...</div>
              </div>
            ) : savedProfiles.length === 0 ? (
              <div className="market-status-overlay">
                <p className="insight-text">You haven't saved any profiles yet.</p>
              </div>
            ) : (
              savedProfiles.map((profile) => (
                <div key={profile.id} className="posting-card-pro">
                  <div className="card-body-pro">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4>{profile.studentName || "Unknown Student"}</h4>
                      <button 
                        className="close-btn-glass" 
                        style={{ padding: '4px', fontSize: '1rem', color: '#ff6b6b' }}
                        onClick={() => unsaveProfile(profile.studentId)}
                        title="Remove from saved"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="loc">{profile.studentProgram || "N/A"}</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px' }}>
                      Year: {profile.studentYearLevel || "N/A"}
                    </p>
                  </div>
                  <div className="card-actions-pro">
                    <button className="edit-btn-glass" onClick={() => openStudentProfile(profile)}>View Profile</button>
                    <button className="btn-primary-pro" onClick={() => openChatWith({ email: profile.studentEmail, name: profile.studentName })}>Message</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {isProfileModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal-pro">
            <div className="modal-aurora-glow"></div>
            <div className="modal-inner-content">
              <div className="modal-header-pro">
                <div>
                  <span className="bento-label">Talent Profile</span>
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
                <button className="close-btn-glass" onClick={() => setIsProfileModalOpen(false)}>✕</button>
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
                          📄 View Student Resume (PDF)
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

                    {selectedStudent.studentResumeUrl && (
                      <div className="mini-item" style={{ marginTop: '24px' }}>
                        <label>Professional Resume</label>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text)', opacity: 0.8 }}>Resume Document</span>
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
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: 700
                              }}
                            >
                              📂 Open Full View
                            </a>
                          </div>
                          <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <iframe 
                              src={`${selectedStudent.studentResumeUrl}#toolbar=0`} 
                              width="100%" 
                              height="100%" 
                              style={{ border: 'none' }}
                              title="Resume Preview"
                            ></iframe>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer-pro" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px' }}>
                <button className="btn-secondary-glass" onClick={() => setIsProfileModalOpen(false)}>Close Profile</button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn-secondary-glass" 
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} 
                    onClick={() => unsaveProfile(selectedStudent.studentId)}
                  >
                    ⭐ Saved
                  </button>
                  <button className="btn-secondary-glass" style={{ borderColor: 'rgba(57, 198, 184, 0.3)', color: '#39c6b8' }} onClick={() => openChatWith({ email: selectedStudent.studentEmail, name: selectedStudent.studentName })}>💬 Message Student</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
