import { NavLink } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/sidebar.css";

export default function Sidebar() {
	const { currentUser } = useContext(AuthContext);
	const role = currentUser?.role || "STUDENT";

	return (
		<aside className="sidebar">
			<div className="sidebar-group">
				<h3 className="sidebar-label">Main Navigation</h3>
				{role === "STUDENT" && (
					<>
						<NavLink to="/dashboard/student" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							Dashboard
						</NavLink>
						<NavLink to="/profile/build" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							Profile Builder
						</NavLink>
						<NavLink to="/prep-lab" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							Prep Lab
						</NavLink>
					</>
				)}
				{role === "EMPLOYER" && (
					<>
						<NavLink to="/dashboard/employer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							Dashboard
						</NavLink>
						<NavLink to="/saved-profiles" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							Saved Talent
						</NavLink>
					</>
				)}
				{role === "ADMIN" && (
					<NavLink to="/dashboard/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
						Dashboard
					</NavLink>
				)}
				<NavLink to="/feed" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
					Feed
				</NavLink>
			</div>
			
			<div className="sidebar-group">
				<h3 className="sidebar-label">General</h3>
				<NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
					Home
				</NavLink>
			</div>
		</aside>
	);
}