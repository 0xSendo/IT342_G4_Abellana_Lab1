import { useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "../styles/home.css";
import Navbar from "../components/Navbar";

function getRoleDashboard(role) {
  if (role === "EMPLOYER") return "/dashboard/employer";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/student";
}

export default function Home() {
  const { loginWithOAuth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const oauthToken = searchParams.get("token");
  const oauthEmail = searchParams.get("email");
  const oauthName = searchParams.get("name");
  const oauthRole = searchParams.get("role");

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

  return (
    <>
      <Navbar />
      <section className="hero">
        <h1>Find the Right Internship, Faster</h1>
        <p>
          InternMatch connects students with companies offering meaningful
          internship opportunities.
        </p>
        <div className="hero-buttons">
          <a href="/register" className="primary-btn">Get Started</a>
          <a href="/login" className="secondary-btn">Login</a>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          🎓 <h3>For Students</h3>
          <p>Discover internships and track your applications.</p>
        </div>

        <div className="feature-card">
          🏢 <h3>For Employers</h3>
          <p>Post opportunities and manage applicants easily.</p>
        </div>

        <div className="feature-card">
          🔐 <h3>Secure System</h3>
          <p>JWT authentication with role-based access.</p>
        </div>
      </section>
    </>
  );
}
