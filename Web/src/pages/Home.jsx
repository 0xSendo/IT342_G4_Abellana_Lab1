import { useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "../styles/home.css";
import Navbar from "../components/Navbar";

function parseHashParams(hash) {
  if (!hash || !hash.startsWith("#")) return new URLSearchParams();
  return new URLSearchParams(hash.substring(1));
}

function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function getRoleDashboard(role) {
  if (role === "EMPLOYER") return "/dashboard/employer";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/student";
}

export default function Home() {
  const { loginWithOAuth, isAuthenticated, currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      navigate(getRoleDashboard(currentUser.role), { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hashParams = useMemo(() => parseHashParams(location.hash), [location.hash]);

  const oauthToken = searchParams.get("token");
  const oauthEmail = searchParams.get("email");
  const oauthName = searchParams.get("name");
  const oauthRole = searchParams.get("role");

  const implicitAccessToken = hashParams.get("access_token");
  const implicitIdToken = hashParams.get("id_token");

  useEffect(() => {
    if (!oauthToken || !oauthEmail) return;

    const result = loginWithOAuth({
      token: oauthToken,
      email: oauthEmail,
      name: oauthName,
      role: oauthRole,
    });

    if (result.ok) {
      navigate(getRoleDashboard(result.user.role), { replace: true });
    }
  }, [oauthToken, oauthEmail, oauthName, oauthRole, loginWithOAuth, navigate]);

  useEffect(() => {
    if (!implicitAccessToken && !implicitIdToken) return;

    const idTokenPayload = implicitIdToken ? decodeJwtPayload(implicitIdToken) : null;
    const email = idTokenPayload?.email;
    const name = idTokenPayload?.name || email;

    if (!email) return;

    const result = loginWithOAuth({
      token: implicitAccessToken || implicitIdToken,
      email,
      name,
      role: "STUDENT",
    });

    if (result.ok) {
      navigate(getRoleDashboard(result.user.role), { replace: true });
    }
  }, [implicitAccessToken, implicitIdToken, loginWithOAuth, navigate]);

  return (
    <div className="home-container">
      <Navbar />
      
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">🚀 The Future of Internships</div>
            <h1 className="hero-title">
              Find the Right <span className="gradient-text">Internship</span>, Faster.
            </h1>
            <p className="hero-subtitle">
              InternMatch connects top-tier students with industry-leading companies 
              offering meaningful internship opportunities. Your career starts here.
            </p>
            <div className="hero-cta">
              <a href="/register" className="primary-btn-large">Start for Free</a>
              <a href="/login" className="secondary-btn-large">Learn More →</a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <strong>5k+</strong>
                <span>Active Students</span>
              </div>
              <div className="stat-item">
                <strong>200+</strong>
                <span>Companies</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card main-visual">
              <div className="visual-header">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <div className="visual-content">
                <div className="visual-skeleton header-skeleton"></div>
                <div className="visual-grid-skeleton">
                  <div className="visual-skeleton item-skeleton"></div>
                  <div className="visual-skeleton item-skeleton"></div>
                  <div className="visual-skeleton item-skeleton"></div>
                </div>
              </div>
            </div>
            <div className="visual-card floating-card-1">✨ New Opportunities</div>
            <div className="visual-card floating-card-2">📈 High Growth</div>
          </div>
        </section>

        <section className="bento-features">
          <div className="section-header">
            <h2>Designed for <span className="gradient-text">Success</span></h2>
            <p>Everything you need to land your dream internship or find top talent.</p>
          </div>
          
          <div className="bento-grid">
            <div className="bento-card large student-card">
              <div className="card-icon">🎓</div>
              <h3>For Students</h3>
              <p>Build your professional profile, apply to top companies, and track your applications in real-time with our intuitive dashboard.</p>
              <div className="card-action">Explore Features →</div>
            </div>

            <div className="bento-card medium employer-card">
              <div className="card-icon">🏢</div>
              <h3>For Employers</h3>
              <p>Post opportunities, manage applicants, and find the perfect match for your team with ease.</p>
              <div className="card-action">Hire Talent →</div>
            </div>

            <div className="bento-card small secure-card">
              <div className="card-icon">🔐</div>
              <h3>Secure System</h3>
              <p>Industry-standard JWT authentication and role-based access control.</p>
            </div>

            <div className="bento-card small fast-card">
              <div className="card-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Real-time notifications and instant updates on your application status.</p>
            </div>

            <div className="bento-card small global-card">
              <div className="card-icon">🌍</div>
              <h3>Global Reach</h3>
              <p>Connect with companies from across the globe, remotely or in-person.</p>
            </div>
          </div>
        </section>

        <section className="cta-banner">
          <div className="cta-content">
            <h2>Ready to <span className="gradient-text">Kickstart</span> Your Career?</h2>
            <p>Join thousands of students and employers already using InternMatch.</p>
            <div className="cta-actions">
              <a href="/register" className="primary-btn-large">Get Started Now</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="simple-footer">
        <p>&copy; 2026 InternMatch. Built for the next generation of builders.</p>
      </footer>
    </div>
  );
}