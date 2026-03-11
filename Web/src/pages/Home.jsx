import { useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "../styles/home.css";
import Navbar from "../components/Navbar";

export default function Home() {
  const { isAuthenticated, loginWithOAuth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const googleOauth2Url = import.meta.env.VITE_GOOGLE_OAUTH2_URL || "/oauth2/authorization/google";

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const oauthToken = searchParams.get("token");
  const oauthEmail = searchParams.get("email");
  const oauthName = searchParams.get("name");
  const oauthRole = searchParams.get("role");

  useEffect(() => {
    const hasStoredSession = !!localStorage.getItem("internmatch_currentUser");

    if (oauthToken && oauthEmail) {
      const result = loginWithOAuth({
        token: oauthToken,
        email: oauthEmail,
        name: oauthName,
        role: oauthRole,
      });

      if (result.ok) {
        navigate("/", { replace: true });
      }
      return;
    }

    if (!isAuthenticated && !hasStoredSession) {
      const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, "");
      window.location.replace(`${normalizedBaseUrl}${googleOauth2Url}`);
    }
  }, [
    apiBaseUrl,
    googleOauth2Url,
    isAuthenticated,
    loginWithOAuth,
    navigate,
    oauthEmail,
    oauthName,
    oauthRole,
    oauthToken,
  ]);

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <section className="hero">
          <h1>Redirecting to Google Sign-In...</h1>
          <p>Please wait while InternMatch authenticates your account.</p>
        </section>
      </>
    );
  }

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
