import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

export default function OAuthCallback() {
  const { loginWithOAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processOAuth = () => {
      console.log("OAuth Callback: Processing...");
      console.log("Hash:", location.hash);
      console.log("Search:", location.search);

      // Check both hash and search (just in case)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const searchParams = new URLSearchParams(location.search);
      
      const token = hashParams.get("token") || searchParams.get("token");
      const email = hashParams.get("email") || searchParams.get("email");
      const name = hashParams.get("name") || searchParams.get("name");
      const role = hashParams.get("role") || searchParams.get("role");

      console.log("Parsed Params:", { hasToken: !!token, email, role });

      if (token && email) {
        console.log("OAuth Callback: Attempting loginWithOAuth...");
        const result = loginWithOAuth({ token, email, name, role });
        console.log("Login Result:", result);
        
        if (result.ok) {
          const dashboard = role === "EMPLOYER" 
            ? "/dashboard/employer" 
            : role === "ADMIN" 
              ? "/dashboard/admin" 
              : "/dashboard/student";
          
          console.log("Redirecting to:", dashboard);
          navigate(dashboard, { replace: true });
        } else {
          console.error("Login failed:", result.message);
          navigate("/login");
        }
      } else {
        console.warn("OAuth Callback: Missing token or email");
        // If we stay here for more than 2 seconds, something is wrong
        const timer = setTimeout(() => {
          console.log("Timeout: Redirecting to login");
          navigate("/login");
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    processOAuth();
  }, [location, navigate, loginWithOAuth]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <h2>Completing login...</h2>
    </div>
  );
}
