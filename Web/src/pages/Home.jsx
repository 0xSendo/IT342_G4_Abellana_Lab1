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
  const { loginWithOAuth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

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
