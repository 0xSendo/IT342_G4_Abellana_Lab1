import { useState, useContext, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/common/bento.css";
import "../../styles/student/student-dashboard.css";

export default function ProfileBuilder() {
  const { currentUser, updateProfile, uploadResume, removeResume } = useContext(AuthContext);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("essentials");
  const [isUploading, setIsUploading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    program: "",
    yearLevel: "",
    skills: "",
    bio: "",
    projects: "",
    resumeUrl: "",
    linkedin: "",
    website: "",
  });

  // Load initial data only once or when currentUser is first available
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (currentUser && !isInitialized) {
      setForm({
        name: currentUser.name || "",
        program: currentUser.program || "",
        yearLevel: currentUser.yearLevel || "",
        skills: currentUser.skills || "",
        bio: currentUser.bio || "",
        projects: currentUser.projects || "",
        resumeUrl: currentUser.resumeUrl || "",
        linkedin: currentUser.linkedin || "",
        website: currentUser.website || "",
      });
      setIsInitialized(true);
    }
  }, [currentUser, isInitialized]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.show("File too large. Max 5MB.", "error");
      return;
    }

    setIsUploading(true);
    const result = await uploadResume(file);
    setIsUploading(false);

    if (result.fileDownloadUri) {
      setForm(prev => ({ ...prev, resumeUrl: result.fileDownloadUri }));
      toast.show("Resume uploaded successfully! Please click Save Changes to finalize.", "success");
    } else {
      toast.show(result.message || "Upload failed.", "error");
    }
  };

  const handleRemoveResume = async () => {
    if (window.confirm("Are you sure you want to remove your resume? This will take effect immediately.")) {
      const res = await removeResume();
      if (res.ok) {
        setForm(prev => ({ ...prev, resumeUrl: "" }));
        toast.show("Resume removed successfully.", "success");
      } else {
        toast.show(res.message || "Failed to remove resume.", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.ok) {
      toast.show("Profile updated successfully! Your changes are now live.", "success");
    } else {
      const msg = res.message || "Unable to save profile changes.";
      if (msg.includes("MODERATION_ERROR")) {
        toast.show(msg.replace("MODERATION_ERROR: ", ""), "warning");
      } else {
        toast.show(msg, "error");
      }
    }
  };

  return (
    <DashboardLayout title="Profile Builder">
      <div className="student-dashboard-wrapper">
        <section className="student-hero">
          <div className="hero-aurora-bg">
            <div className="blob one"></div>
            <div className="blob two"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge">Professional Growth</span>
              <h1>Build your <span className="gradient-text">Identity</span> 🚀</h1>
              <p>Complete your profile to stand out to potential employers and internship providers.</p>
            </div>
          </div>
        </section>

        <div className="bento-card" style={{ marginTop: '2rem', padding: '0', maxWidth: '900px', margin: '2rem auto' }}>
          <div className="modal-tabs-pro" style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              className={`modal-tab-btn ${activeTab === 'essentials' ? 'active' : ''}`}
              onClick={() => setActiveTab('essentials')}
            >
              🔑 Essentials
            </button>
            <button 
              className={`modal-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              🛠️ Skills
            </button>
            <button 
              className={`modal-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              🚀 Portfolio
            </button>
            <button 
              className={`modal-tab-btn ${activeTab === 'resume' ? 'active' : ''}`}
              onClick={() => setActiveTab('resume')}
            >
              📄 Resume
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '40px' }}>
            {activeTab === 'essentials' && (
              <div className="form-grid-pro" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="input-group-pro">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="input-group-pro">
                  <label>Academic Program</label>
                  <input name="program" value={form.program} onChange={handleChange} placeholder="e.g. BS Information Technology" />
                </div>
                <div className="input-group-pro">
                  <label>Year Level</label>
                  <select name="yearLevel" value={form.yearLevel} onChange={handleChange}>
                    <option value="">Select Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="input-group-pro">
                  <label>LinkedIn Profile URL</label>
                  <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="input-group-pro full-width">
                  <label>Personal Website / GitHub Portfolio</label>
                  <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourportfolio.com or github.com/username" />
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="input-group-pro full-width">
                <label>Technical Skills (comma separated)</label>
                <textarea 
                  name="skills" 
                  value={form.skills} 
                  onChange={handleChange} 
                  placeholder="e.g. React, Java, Spring Boot, Figma"
                  rows={4}
                />
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="form-grid-pro" style={{ display: 'grid', gap: '2rem' }}>
                <div className="input-group-pro full-width">
                  <label>Professional Bio</label>
                  <textarea 
                    name="bio" 
                    value={form.bio} 
                    onChange={handleChange} 
                    placeholder="Tell employers about your goals and interests..."
                    rows={4}
                  />
                </div>
                <div className="input-group-pro full-width">
                  <label>Featured Projects</label>
                  <textarea 
                    name="projects" 
                    value={form.projects} 
                    onChange={handleChange} 
                    placeholder="Describe your best work or link to your portfolio..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeTab === 'resume' && (
              <div className="resume-upload-section" style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                {form.resumeUrl ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📄</div>
                    <p style={{ fontWeight: 700, color: 'var(--primary)' }}>Resume is uploaded!</p>
                    <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', textDecoration: 'underline', fontSize: '0.9rem' }}>View Current Resume</a>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.3 }}>📤</div>
                    <p style={{ color: 'var(--muted)' }}>No resume uploaded yet.</p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <label className="btn-primary-pro" style={{ display: 'inline-block', cursor: 'pointer' }}>
                    {isUploading ? "Uploading..." : form.resumeUrl ? "Replace Resume" : "Upload Resume (PDF)"}
                    <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                  </label>

                  {form.resumeUrl && (
                    <button 
                      type="button"
                      className="btn-primary-pro" 
                      onClick={handleRemoveResume}
                      style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', border: '1px solid rgba(255, 59, 48, 0.2)' }}
                    >
                      Remove Resume
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '10px' }}>PDF format only, max 5MB.</p>
              </div>
            )}

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="submit" 
                className="btn-primary-pro" 
                style={{ padding: '12px 30px' }}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
