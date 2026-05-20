import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useContext } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import EmployerDashboard from "./pages/dashboards/EmployerDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import PrepLab from "./pages/student/PrepLab";
import ProfileBuilder from "./pages/student/ProfileBuilder";
import RequireAuth from "./components/RequireAuth";
import AuthContext from "./context/AuthContext";

function App() {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Simple role-based redirect for "/" if logged in
  useEffect(() => {
    if (currentUser && location.pathname === "/") {
      if (currentUser.role === "EMPLOYER") navigate("/dashboard/employer");
      else if (currentUser.role === "ADMIN") navigate("/dashboard/admin");
      else navigate("/dashboard/student");
    }
  }, [currentUser, location, navigate]);

  return (
    <Routes>
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
      <Route
        path="/feed"
        element={
          <RequireAuth>
            <Feed />
          </RequireAuth>
        }
      />
      <Route
        path="/prep-lab"
        element={
          <RequireAuth>
            <PrepLab />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/build"
        element={
          <RequireAuth>
            <ProfileBuilder />
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
