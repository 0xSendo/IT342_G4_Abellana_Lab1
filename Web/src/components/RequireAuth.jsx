import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

export default function RequireAuth({ children }) {
	const { isAuthenticated, currentUser } = useContext(AuthContext);
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	const role = currentUser?.role || "STUDENT";
	const roleDashboard =
		role === "EMPLOYER"
			? "/dashboard/employer"
			: role === "ADMIN"
				? "/dashboard/admin"
				: "/dashboard/student";

	if (location.pathname.startsWith("/dashboard/") && !location.pathname.startsWith(roleDashboard)) {
		return <Navigate to={roleDashboard} replace />;
	}

	return children;
}

