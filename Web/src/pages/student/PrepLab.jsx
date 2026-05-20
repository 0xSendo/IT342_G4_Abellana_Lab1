import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";
import { useToast } from "../../context/ToastContext";
import "../../styles/common/bento.css";
import "../../styles/student/prep-lab.css";
import "../../styles/notifications.css";

const MOCK_QUESTIONS = [
  { 
    id: 1, 
    category: "Behavioral", 
    text: "Tell me about a time you faced a significant challenge in a project. How did you handle it?",
    tips: "Focus on a specific situation. Use the STAR method: Situation, Task, Action, Result."
  },
  { 
    id: 2, 
    category: "Behavioral", 
    text: "Why do you want to intern with our company specifically?",
    tips: "Show you've researched the company. Mention their recent projects or company values."
  },
  { 
    id: 3, 
    category: "Technical", 
    text: "Explain the concept of 'State Management' in a web application.",
    tips: "Compare local vs global state. Mention tools like React Context or Redux if applicable."
  },
  { 
    id: 4, 
    category: "Technical", 
    text: "What is the difference between a REST API and GraphQL?",
    tips: "Discuss over-fetching vs under-fetching and the flexibility of data requests."
  },
  { 
    id: 5, 
    category: "Problem Solving", 
    text: "How would you prioritize tasks when you have multiple deadlines in the same week?",
    tips: "Mention tools like Eisenhower Matrix or Jira. Focus on impact and urgency."
  }
];

const PREP_RESOURCES = [
  { 
    id: 1, 
    title: "PH Resume Guide", 
    desc: "JobStreet's official guide to crafting a winning resume for the local market.", 
    icon: "📄",
    url: "https://www.jobstreet.com.ph/career-advice/resume-writing/" 
  },
  { 
    id: 2, 
    title: "PH Internship Guide", 
    desc: "A foundational guide by foundit on what internships mean in the local PH context.", 
    icon: "🇵🇭",
    url: "https://www.foundit.com.ph/career-advice/what-is-an-internship-in-philippines/"
  },
  { 
    id: 3, 
    title: "Interview Prep (PH)", 
    desc: "Kalibrr's guide on how to ace interviews with top Philippine companies.", 
    icon: "⭐",
    url: "https://www.kalibrr.com/blog/2016/04/how-to-ace-your-first-job-interview"
  },
  { 
    id: 4, 
    title: "DOLE Career Tools", 
    desc: "Official government resources and labor market trends from PhilJobNet.", 
    icon: "🏛️",
    url: "https://philjobnet.gov.ph/"
  }
];

export default function PrepLab() {
  const toast = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("internmatch_token");
      if (!token) return;
      await axios.put(`${API_BASE}/api/notifications/read-all`, {}, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const token = localStorage.getItem("internmatch_token");
      await axios.delete(`${API_BASE}/api/notifications/${notifId}`, {
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
      await axios.delete(`${API_BASE}/api/notifications/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      toast.show("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      toast.show("Failed to clear notifications", "error");
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
  };

  const openNotifications = () => {
    setIsNotificationsModalOpen(true);
    markNotificationsAsRead();
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem("internmatch_prepChecklist");
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Company & Role Research", done: false },
      { id: 2, text: "STAR Method Practice", done: false },
      { id: 3, text: "Technical Skill Drill", done: false },
      { id: 4, text: "Interviewer Questions Ready", done: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem("internmatch_prepChecklist", JSON.stringify(checklist));
  }, [checklist]);

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
    const item = checklist.find(i => i.id === id);
    if (!item.done) {
      toast.show("Task completed! Keep it up. 🚀", "success");
    }
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex((prev) => (prev + 1) % MOCK_QUESTIONS.length);
    setAnswer("");
    setFeedback(null);
  };

  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];

  const evaluateAnswer = () => {
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer.length < 20) {
      toast.show("Please provide a more detailed answer for evaluation.", "warning");
      return;
    }

    setIsEvaluating(true);
    
    // Enhanced Logic-Based Evaluation
    setTimeout(() => {
      const lowerAnswer = trimmedAnswer.toLowerCase();
      const words = lowerAnswer.split(/\s+/).filter(w => w.length > 0);
      const uniqueWords = new Set(words);
      
      let score = 0;
      let strengths = [];
      let improvements = [];

      // 1. GIBBERISH DETECTION (Density & Commonality)
      const commonEnglishWords = ["the", "and", "a", "to", "in", "is", "it", "you", "that", "he", "was", "for", "on", "are", "with", "as", "i", "his", "they", "be", "at", "one", "have", "this", "from", "or", "had", "by", "hot", "word", "but", "some", "what", "we", "can", "out", "other", "were", "all", "there", "when", "up", "use", "your", "how", "said", "an", "each", "she"];
      const commonWordCount = words.filter(w => commonEnglishWords.includes(w)).length;
      const commonWordDensity = commonWordCount / words.length;
      const varietyRatio = uniqueWords.size / words.length;

      // If very low common word density or extremely repetitive, flag as potential gibberish
      const isPotentialGibberish = commonWordDensity < 0.1 || (varietyRatio < 0.2 && words.length > 30);

      // 2. RELEVANCE CHECK (Keywords based on category)
      const categoryKeywords = {
        "Behavioral": ["action", "result", "situation", "task", "learned", "managed", "problem", "resolved", "team", "worked", "achieved", "impact"],
        "Technical": ["system", "data", "logic", "code", "architecture", "tool", "framework", "performance", "scalable", "efficient", "management", "state", "api"],
        "Problem Solving": ["priority", "deadline", "organized", "impact", "solution", "identified", "urgency", "decision", "approach", "analyzed"]
      };

      const relevantKeywords = categoryKeywords[currentQuestion.category] || [];
      const matchedKeywords = relevantKeywords.filter(kw => lowerAnswer.includes(kw));
      const relevanceScore = (matchedKeywords.length / Math.min(relevantKeywords.length, 5)) * 100;

      // 3. STRUCTURE CHECK (STAR Method etc)
      const hasStructure = (lowerAnswer.includes("situation") || lowerAnswer.includes("time when")) && 
                           (lowerAnswer.includes("result") || lowerAnswer.includes("outcome") || lowerAnswer.includes("finally") || lowerAnswer.includes("ended up"));

      // SCORING CALCULATION
      if (isPotentialGibberish || words.length < 10) {
        score = Math.floor(Math.random() * 10) + 5; // 5-15%
        strengths.push("Length is present.");
        improvements.push("This response appears to be low-quality or gibberish. Use real words and meaningful sentences.");
        improvements.push("An interviewer expects a structured, professional story.");
      } else {
        // Base score on length (max 30 pts)
        const lengthPoints = Math.min(trimmedAnswer.length / 20, 30);
        // Points for relevance (max 40 pts)
        const relevancePoints = Math.min(relevanceScore * 0.4, 40);
        // Points for structure (max 30 pts)
        const structurePoints = hasStructure ? 30 : 10;

        score = Math.round(lengthPoints + relevancePoints + structurePoints);
        
        // Final sanity cap for non-structured answers
        if (!hasStructure && score > 70) score = 70;
        
        // Caps and floors
        score = Math.min(Math.max(score, 20), 98);

        // Feedback generation
        if (trimmedAnswer.length > 200) strengths.push("Excellent depth and detail.");
        else if (trimmedAnswer.length > 100) strengths.push("Good descriptive effort.");
        
        if (relevanceScore > 50) strengths.push(`Strong use of ${currentQuestion.category.toLowerCase()} terminology.`);
        if (hasStructure) strengths.push("Followed a clear logical structure (STAR-like).");

        if (relevanceScore < 30) improvements.push(`Try to use more keywords related to ${currentQuestion.category} concepts.`);
        if (!hasStructure) improvements.push("Try to explicitly state the 'Result' or 'Outcome' of your story.");
        if (words.length < 30) improvements.push("Try expanding your answer to provide more context for the interviewer.");
      }

      setFeedback({ 
        score, 
        strengths: strengths.length > 0 ? strengths.join(" ") : "None identified.", 
        improvement: improvements.length > 0 ? improvements.join(" ") : "Keep practicing to refine your delivery!" 
      });
      setIsEvaluating(false);
      
      if (score < 40) {
        toast.show("Evaluation complete. This response needs significant work.", "warning");
      } else if (score < 70) {
        toast.show("Good effort! Focus on structure to improve your score.", "info");
      } else {
        toast.show("Excellent practice response!", "success");
      }
    }, 1500);
  };

  return (
    <DashboardLayout 
      title="Interview & Prep Lab"
      onNotificationClick={openNotifications}
      notificationCount={notifications.filter(n => !n.read).length}
    >
      <div className="prep-lab-wrapper">
        <section className="student-hero">
          <div className="hero-aurora-bg">
            <div className="blob one" style={{ background: 'rgba(57, 198, 184, 0.3)' }}></div>
            <div className="blob two" style={{ background: 'rgba(255, 107, 74, 0.2)' }}></div>
          </div>
          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-badge" style={{ color: '#39c6b8', borderColor: 'rgba(57, 198, 184, 0.3)' }}>Skill Accelerator</span>
              <h1>Interview & <span className="gradient-text">Prep Lab</span> 🔬</h1>
              <p>Practice with active simulations and expert-vetted resources to gain a competitive edge.</p>
            </div>
            <div className="hero-summary-stats">
              <div className="summary-stat-glass primary">
                <span className="val">{checklist.filter(i => i.done).length}/{checklist.length}</span>
                <span className="lab">Tasks Done</span>
              </div>
              <div className="summary-stat-glass">
                <span className="val">{MOCK_QUESTIONS.length}</span>
                <span className="lab">Modules</span>
              </div>
            </div>
          </div>
        </section>

        <div className="prep-grid-main">
          {/* Main Prep Content */}
          <div className="prep-left-col">
            <section className="bento-card simulator-card">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Practice Session</span>
                  <h3>Active Interview Simulator</h3>
                </div>
                <span className="hero-badge" style={{ margin: 0 }}>{currentQuestion.category}</span>
              </div>
              
              <div className="simulator-content">
                <div className="question-box">
                  <p className="question-text">"{currentQuestion.text}"</p>
                </div>

                <div className="answer-input-container">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Your Response</label>
                  <textarea 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your response here... Try to be specific and use the STAR method."
                    style={{ 
                      width: '100%', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '14px', 
                      padding: '1rem', 
                      color: 'var(--text)', 
                      minHeight: '120px',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                {feedback && (
                  <div className="feedback-panel" style={{ background: 'rgba(57, 198, 184, 0.1)', border: '1px solid rgba(57, 198, 184, 0.3)', borderRadius: '14px', padding: '1.25rem', animation: 'fadeUp 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 800, color: '#39c6b8' }}>AI Evaluation Result</span>
                      <strong style={{ fontSize: '1.1rem' }}>Score: {feedback.score}%</strong>
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: '5px 0' }}><strong>Strengths:</strong> {feedback.strengths}</p>
                    <p style={{ fontSize: '0.85rem', margin: '5px 0' }}><strong>Improvement:</strong> {feedback.improvement}</p>
                  </div>
                )}

                <div className="simulator-actions" style={{ marginTop: '0.5rem' }}>
                  <button className="btn-secondary-glass" onClick={() => toast.show(`Tip: ${currentQuestion.tips}`, "info")}>Get Strategy Tip</button>
                  <button className="btn-primary-pro" onClick={evaluateAnswer} disabled={isEvaluating || !answer.trim()}>
                    {isEvaluating ? "Analyzing..." : "Evaluate Answer ✨"}
                  </button>
                  <button className="edit-btn-glass" onClick={nextQuestion}>Skip Question</button>
                </div>
              </div>
            </section>

            <section className="bento-card" style={{ marginTop: '2rem' }}>
              <div className="bento-header">
                <div>
                  <span className="bento-label">Knowledge Base</span>
                  <h3>Vetted Expert Resources</h3>
                </div>
              </div>
              <div className="resources-grid">
                {PREP_RESOURCES.map(res => (
                  <div key={res.id} className="resource-card">
                    <div className="resource-icon">{res.icon}</div>
                    <h4>{res.title}</h4>
                    <p>{res.desc}</p>
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="edit-btn-glass" 
                      style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', marginTop: 'auto' }}
                    >
                      Open Guide ↗
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Checklist */}
          <div className="prep-right-col">
            <section className="bento-card checklist-card">
              <div className="bento-header">
                <div>
                  <span className="bento-label">Success Path</span>
                  <h3>Ready for Interview?</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>Complete these core tasks to maximize your chances of getting the offer.</p>
              
              <div className="checklist-items">
                {checklist.map(item => (
                  <div 
                    key={item.id} 
                    className={`check-item ${item.done ? 'active' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="bullet">{item.done ? '✓' : ''}</div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="readiness-score" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>Readiness Score</span>
                  <strong style={{ fontSize: '0.9rem', color: '#39c6b8' }}>
                    {Math.round((checklist.filter(i => i.done).length / checklist.length) * 100)}%
                  </strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(checklist.filter(i => i.done).length / checklist.length) * 100}%`, 
                    height: '100%', 
                    background: '#39c6b8',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            </section>

            <section className="bento-card pro-tips-bento" style={{ marginTop: '2rem' }}>
              <div className="bento-header">
                <div>
                  <span className="bento-label">Company Tip</span>
                  <h3>Top 3 Requirements</h3>
                </div>
              </div>
              <div className="tip-content">
                <p>Employers on InternMatch highly value <strong>Problem Solving</strong>, <strong>Teamwork</strong>, and <strong>Adaptability</strong>.</p>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>✅ Communication is key</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>✅ Show your passion</div>
                  <div style={{ display: 'flex', gap: '8px' }}>✅ Ask deep questions</div>
                </div>
              </div>
            </section>
          </div>
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
