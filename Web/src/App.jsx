import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import EmployerDashboard from "./pages/dashboards/EmployerDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import RequireAuth from "./components/RequireAuth";


function App() {
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
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
