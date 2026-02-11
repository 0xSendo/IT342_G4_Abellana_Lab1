import { Link } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/sidebar.css";

export default function Sidebar() {
	const { currentUser } = useContext(AuthContext);
	const role = currentUser?.role || "STUDENT";

	return (
		<aside className="sidebar">
			<h2>Dashboard</h2>
			{role === "STUDENT" && <Link to="/dashboard/student">Student</Link>}
			{role === "EMPLOYER" && <Link to="/dashboard/employer">Employer</Link>}
			{role === "ADMIN" && <Link to="/dashboard/admin">Admin</Link>}
			<Link to="/">Home</Link>
		</aside>
	);
}

