import { useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import AuthContext from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin/admin-dashboard.css";

// SVG Icons
const Icons = {
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Internships: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  Apps: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  )
};

const DetailsModal = ({ item, onClose, activeTab }) => {
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div className="admin-bento-header">
          <span className="admin-bento-title">Detailed Oversight</span>
          <button onClick={onClose} className="admin-action-btn">Close</button>
        </div>
        <div className="panel-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
          {activeTab === 'DIRECTORY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>NAME</label><div>{item.name}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>EMAIL</label><div>{item.email}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>ROLE</label><div className={`status-badge ${item.role?.toLowerCase()}`}>{item.role}</div></div>
            </div>
          )}
          
          {activeTab === 'INTERNSHIPS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>TITLE</label><div>{item.title}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>COMPANY</label><div>{item.company}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>POSTED BY</label><div>{item.postedByName} ({item.postedByEmail})</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>DESCRIPTION</label><div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{item.description}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>LOCATION</label><div>{item.location} ({item.setup})</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>STATUS</label><div className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</div></div>
            </div>
          )}

          {activeTab === 'COMMUNITY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>STUDENT</label><div>{item.studentName} ({item.studentEmail})</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>CONTENT</label><div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{item.content}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>TYPE</label><div>{item.type}</div></div>
              {item.studentBio && (
                <>
                  <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>BIO</label><div style={{ fontSize: '0.85rem' }}>{item.studentBio}</div></div>
                  <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>SKILLS</label><div style={{ fontSize: '0.85rem' }}>{item.studentSkills}</div></div>
                </>
              )}
            </div>
          )}

          {activeTab === 'APPLICATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>CANDIDATE</label><div>{item.studentName} ({item.studentEmail})</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>INTERNSHIP</label><div>{item.internshipTitle} at {item.company}</div></div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>STUDENT INFO</label>
                <div style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                  <p><strong>Program:</strong> {item.studentProgram}</p>
                  <p><strong>Year:</strong> {item.studentYearLevel}</p>
                  <p><strong>Bio:</strong> {item.studentBio}</p>
                  <p><strong>Skills:</strong> {item.studentSkills}</p>
                </div>
              </div>
              <div><label style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>STATUS</label><div className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { currentUser, getUsers } = useContext(AuthContext);
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [internships, setInternships] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUptime, setSystemUptime] = useState("00:00:00");
  const [activeTab, setActiveTab] = useState("DIRECTORY");
  const [selectedItem, setSelectedItem] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchAdminData = async (tab) => {
    setIsLoading(true);
    const token = localStorage.getItem("internmatch_token");
    try {
      if (tab === "DIRECTORY") {
        const data = await getUsers();
        setUsers(data || []);
      } else if (tab === "INTERNSHIPS") {
        const res = await axios.get(`${API_BASE}/api/admin/internships`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInternships(res.data || []);
      } else if (tab === "COMMUNITY") {
        const res = await axios.get(`${API_BASE}/api/admin/community`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCommunityPosts(res.data || []);
      } else if (tab === "APPLICATIONS") {
        const res = await axios.get(`${API_BASE}/api/admin/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApplications(res.data || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tab} data`, err);
      toast.show(`System Error: Failed to retrieve ${tab} data.`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setSystemUptime(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalInternships: internships.length,
    totalPosts: communityPosts.length,
    totalApps: applications.length,
    totalItems: internships.length + communityPosts.length
  }), [users, internships, communityPosts, applications]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("CRITICAL ACTION: Are you sure you want to terminate this user's access? This cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`${API_BASE}/api/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.show("User access terminated successfully.");
    } catch (err) {
      console.error("Failed to delete user", err);
      toast.show("Access Termination Failed: Unauthorized or Network Error.", "error");
    }
  };

  const handleDeleteInternship = async (id) => {
    if (!window.confirm("Are you sure you want to delete this internship posting?")) return;
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`${API_BASE}/api/admin/internships/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInternships(prev => prev.filter(i => i.id !== id));
      toast.show("Internship posting deleted.");
    } catch (err) {
      toast.show("Failed to delete internship.", "error");
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this community post?")) return;
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`${API_BASE}/api/admin/community/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommunityPosts(prev => prev.filter(p => p.id !== id));
      toast.show("Community post deleted.");
    } catch (err) {
      toast.show("Failed to delete post.", "error");
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`${API_BASE}/api/admin/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(prev => prev.filter(a => a.id !== id));
      toast.show("Application deleted.");
    } catch (err) {
      toast.show("Failed to delete application.", "error");
    }
  };

  return (
    <DashboardLayout title="Admin Command Center">
      <div className="admin-dashboard-wrapper">
        <DetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} activeTab={activeTab} />
        
        {/* Admin Hero Section */}
        <section className="admin-hero">
          <div className="admin-hero-header">
            <h1>Admin Command Center</h1>
            <p>Welcome back, {currentUser?.name}. System status is optimal.</p>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-label">System Uptime</span>
              <div className="admin-stat-value">{systemUptime}</div>
            </div>
            <div className="admin-stat-card accent">
              <span className="admin-stat-label">Active Nodes</span>
              <div className="admin-stat-value">{stats.totalUsers} Users</div>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Content Load</span>
              <div className="admin-stat-value">{stats.totalItems} Items</div>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Pending Apps</span>
              <div className="admin-stat-value">{stats.totalApps}</div>
            </div>
          </div>
        </section>

        <div className="admin-command-grid">
          {/* Main Control Panel */}
          <div className="admin-bento-card">
            <div className="admin-bento-header">
              <span className="admin-bento-title">
                <Icons.Shield />
                {activeTab} Management
              </span>
              <div className="admin-tabs">
                <button 
                  className={`admin-tab-btn ${activeTab === 'DIRECTORY' ? 'active' : ''}`}
                  onClick={() => setActiveTab('DIRECTORY')}
                >
                  Users
                </button>
                <button 
                  className={`admin-tab-btn ${activeTab === 'INTERNSHIPS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('INTERNSHIPS')}
                >
                  Postings
                </button>
                <button 
                  className={`admin-tab-btn ${activeTab === 'COMMUNITY' ? 'active' : ''}`}
                  onClick={() => setActiveTab('COMMUNITY')}
                >
                  Community
                </button>
                <button 
                  className={`admin-tab-btn ${activeTab === 'APPLICATIONS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('APPLICATIONS')}
                >
                  Apps
                </button>
              </div>
            </div>
            
            <div className="admin-bento-body">
              {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>
                  <div className="loading-spinner">Synchronizing data nodes...</div>
                </div>
              ) : (
                <div className="admin-table-container">
                  {activeTab === 'DIRECTORY' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Identity</th>
                          <th>Endpoint</th>
                          <th>Privilege</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td style={{ fontWeight: 700 }}>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`status-badge ${user.role.toLowerCase()}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="admin-action-btn"
                                  onClick={() => setSelectedItem(user)}
                                >
                                  Inspect
                                </button>
                                {user.email !== currentUser?.email && (
                                  <button 
                                    className="admin-action-btn danger"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Terminate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'INTERNSHIPS' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Organization</th>
                          <th>Posted By</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internships.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700 }}>{item.title}</td>
                            <td>{item.company}</td>
                            <td>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.postedByName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{item.postedByEmail}</div>
                            </td>
                            <td>
                              <span className={`status-badge ${item.status.toLowerCase()}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="admin-action-btn"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  Modify
                                </button>
                                <button 
                                  className="admin-action-btn danger"
                                  onClick={() => handleDeleteInternship(item.id)}
                                >
                                  Wipe
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'COMMUNITY' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Origin</th>
                          <th>Transmission</th>
                          <th>Category</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communityPosts.map((post) => (
                          <tr key={post.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{post.studentName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{post.studentEmail}</div>
                            </td>
                            <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {post.content}
                            </td>
                            <td>{post.type}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="admin-action-btn"
                                  onClick={() => setSelectedItem(post)}
                                >
                                  Audit
                                </button>
                                <button 
                                  className="admin-action-btn danger"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'APPLICATIONS' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Target</th>
                          <th>Phase</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{app.studentName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{app.studentEmail}</div>
                            </td>
                            <td>{app.internshipTitle}</td>
                            <td>
                              <span className={`status-badge ${app.status.toLowerCase()}`}>
                                {app.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="admin-action-btn"
                                  onClick={() => setSelectedItem(app)}
                                >
                                  Review
                                </button>
                                <button 
                                  className="admin-action-btn danger"
                                  onClick={() => handleDeleteApplication(app.id)}
                                >
                                  Revoke
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Intelligence Bento Cards */}
          <div className="admin-info-stack">
            <div className="admin-bento-card">
              <div className="admin-bento-header">
                <span className="admin-bento-title">System Distribution</span>
              </div>
              <div className="admin-bento-body">
                <div className="stat-progress-item">
                  <div className="stat-progress-label">
                    <span>Internships</span>
                    <span>{stats.totalInternships}</span>
                  </div>
                  <div className="stat-progress-bar-bg">
                    <div 
                      className="stat-progress-bar-fill" 
                      style={{ width: `${(stats.totalInternships / (stats.totalInternships + stats.totalPosts + stats.totalApps || 1)) * 100}%`, background: 'var(--primary)' }}
                    ></div>
                  </div>
                </div>
                
                <div className="stat-progress-item">
                  <div className="stat-progress-label">
                    <span>Community Activity</span>
                    <span>{stats.totalPosts}</span>
                  </div>
                  <div className="stat-progress-bar-bg">
                    <div 
                      className="stat-progress-bar-fill" 
                      style={{ width: `${(stats.totalPosts / (stats.totalInternships + stats.totalPosts + stats.totalApps || 1)) * 100}%`, background: '#39c6b8' }}
                    ></div>
                  </div>
                </div>

                <div className="stat-progress-item">
                  <div className="stat-progress-label">
                    <span>Active Applications</span>
                    <span>{stats.totalApps}</span>
                  </div>
                  <div className="stat-progress-bar-bg">
                    <div 
                      className="stat-progress-bar-fill" 
                      style={{ width: `${(stats.totalApps / (stats.totalInternships + stats.totalPosts + stats.totalApps || 1)) * 100}%`, background: '#ffd666' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-bento-card">
              <div className="admin-bento-header">
                <span className="admin-bento-title">Security Log</span>
              </div>
              <div className="admin-bento-body">
                <div className="activity-feed">
                  <div className="activity-item">
                    <div className="activity-icon-box">
                      <Icons.Shield />
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Session Active</span>
                        <span className="activity-time">Now</span>
                      </div>
                      <p className="activity-message">Admin session verified for {currentUser?.name}</p>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-box" style={{ color: '#39c6b8' }}>
                      <Icons.Activity />
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Node Sync</span>
                        <span className="activity-time">2m ago</span>
                      </div>
                      <p className="activity-message">Successfully synchronized {activeTab} data stream.</p>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-box" style={{ color: 'var(--primary)' }}>
                      <Icons.Clock />
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Watchdog</span>
                        <span className="activity-time">System</span>
                      </div>
                      <p className="activity-message">All systems reporting operational status.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
