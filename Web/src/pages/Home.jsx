import { useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "../styles/home.css";
import Navbar from "../components/Navbar";

// ==================== Strategy Pattern Implementation ====================
// Different strategies for parsing OAuth callback data
const oauthStrategies = {
  // Strategy 1: Standard Query Parameters (most common)
  queryParams: (searchParams) => ({
    token: searchParams.get("token"),
    email: searchParams.get("email"),
    name: searchParams.get("name"),
    role: searchParams.get("role"),
  }),

  // Strategy 2: Implicit Flow / Hash Fragment (for some OAuth providers)
  implicitHash: (hashParams, decodeJwtPayload) => {
    const accessToken = hashParams.get("access_token");
    const idToken = hashParams.get("id_token");

    if (!accessToken && !idToken) return null;

    let email = null;
    let name = null;

    if (idToken) {
      const payload = decodeJwtPayload(idToken);
      email = payload?.email;
      name = payload?.name || email;
    }

    return {
      token: accessToken || idToken,
      email,
      name,
      role: "STUDENT",   // Default role for implicit flow
    };
  },
};

// Simple helper to decode JWT (kept as utility)
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

export default function Home() {
  const { loginWithOAuth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hashParams = useMemo(() => {
    if (!location.hash || !location.hash.startsWith("#")) return new URLSearchParams();
    return new URLSearchParams(location.hash.substring(1));
  }, [location.hash]);

  // Role to dashboard mapping (kept simple, no extra pattern)
  const getRoleDashboard = (role) => {
    if (role === "EMPLOYER") return "/dashboard/employer";
    if (role === "ADMIN") return "/dashboard/admin";
    return "/dashboard/student";
  };

  useEffect(() => {
    let oauthData = null;

    // Use Query Params Strategy first
    const queryData = oauthStrategies.queryParams(searchParams);
    if (queryData.token && queryData.email) {
      oauthData = queryData;
    } 
    // Fall back to Implicit Hash Strategy
    else {
      oauthData = oauthStrategies.implicitHash(hashParams, decodeJwtPayload);
    }

    // Process login if we have valid data
    if (oauthData && oauthData.email) {
      const result = loginWithOAuth(oauthData);
      if (result.ok) {
        const dashboardPath = getRoleDashboard(result.user.role);
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [searchParams, hashParams, loginWithOAuth, navigate]);

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
