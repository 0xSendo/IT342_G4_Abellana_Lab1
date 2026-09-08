import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

function getRoleDashboard(role) {
  if (role === "EMPLOYER") return "/dashboard/employer";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/student";
}

export default function OAuthCallback() {
  const { loginWithOAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let redirectTimer;

    const exchangeCode = async (code) => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/oauth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          console.error("OAuth Callback: Code exchange failed", await res.text());
          return { ok: false };
        }

        const authResponse = await res.json();
        const result = loginWithOAuth(authResponse);
        if (!result.ok) {
          console.error("OAuth Callback: Login failed", result.message);
          return { ok: false };
        }

        console.log("OAuth Callback: Redirecting to:", getRoleDashboard(authResponse.role));
        navigate(getRoleDashboard(authResponse.role), { replace: true });
        return { ok: true };
      } catch (err) {
        console.error("OAuth Callback: Code exchange error", err);
        return { ok: false };
      }
    };

    const processOAuth = () => {
      console.log("OAuth Callback: Processing...");
      console.log("Hash:", location.hash);
      console.log("Search:", location.search);

      // Check both hash and search (just in case)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const searchParams = new URLSearchParams(location.search);

      const code = hashParams.get("code") || searchParams.get("code");
      const token = hashParams.get("token") || searchParams.get("token");
      const email = hashParams.get("email") || searchParams.get("email");
      const name = hashParams.get("name") || searchParams.get("name");
      const role = hashParams.get("role") || searchParams.get("role");

      console.log("Parsed Params:", { hasCode: !!code, hasToken: !!token, email, role });

      if (code) {
        console.log("OAuth Callback: Exchanging code for token...");
        exchangeCode(code).then((result) => {
          if (!result.ok) {
            navigate("/login", { replace: true });
          }
        });
        return;
      }

      if (token && email) {
        console.log("OAuth Callback: Attempting loginWithOAuth...");
        const result = loginWithOAuth({ token, email, name, role });
        console.log("Login Result:", result);

        if (result.ok) {
          console.log("Redirecting to:", getRoleDashboard(role));
          navigate(getRoleDashboard(role), { replace: true });
        } else {
          console.error("Login failed:", result.message);
          navigate("/login");
        }
        return;
      }

      console.warn("OAuth Callback: Missing code/token or email");
      // If we stay here for more than 2 seconds, something is wrong
      redirectTimer = setTimeout(() => {
        console.log("Timeout: Redirecting to login");
        navigate("/login");
      }, 2000);
    };

    processOAuth();
    return () => redirectTimer && clearTimeout(redirectTimer);
  }, [location, navigate, loginWithOAuth]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <h2>Completing login...</h2>
    </div>
  );
}