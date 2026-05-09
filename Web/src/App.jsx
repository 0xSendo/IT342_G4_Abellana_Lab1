import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useContext } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import EmployerDashboard from "./pages/dashboards/EmployerDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import RequireAuth from "./components/RequireAuth";
import AuthContext from "./context/AuthContext";

function OAuthCallback() {
  const navigate = useNavigate();
  const { loginWithOAuth } = useContext(AuthContext);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const token = params.get("token");
    const email = params.get("email");
    const name = params.get("name");
    const role = params.get("role");

    if (token && email) {
      const result = loginWithOAuth({
        token,
        email,
        name: name || email,
        role: role || "STUDENT",
      });

      if (result.ok) {
        window.location.hash = "";
        const targetDashboard = role === "EMPLOYER" ? "/dashboard/employer" : "/dashboard/student";
        navigate(targetDashboard, { replace: true });
      }
    } else {
      navigate("/", { replace: true });
    }
  }, [loginWithOAuth, navigate]);

  return <div>Processing login...</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route
        path="/feed"
        element={
          <RequireAuth>
            <Feed />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <RequireAuth>
            <StudentDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/employer"
        element={
          <RequireAuth>
            <EmployerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;