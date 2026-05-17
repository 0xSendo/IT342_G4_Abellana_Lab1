import { Link } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/navbar.css";

export default function Navbar({ onNotificationClick, notificationCount = 0 }) {
	const { isAuthenticated, currentUser, logout } = useContext(AuthContext);

	const onLogout = () => {
		const confirmed = window.confirm("Are you sure you want to log out?");
		if (!confirmed) return;
		logout();
	};

	return (
		<nav className="navbar">
			<Link to="/" className="navbar-logo">
				<h2>InternMatch</h2>
			</Link>
			<div className="navbar-actions">
				{!isAuthenticated && <Link to="/login">Login</Link>}
				{!isAuthenticated && <Link className="nav-btn" to="/register">Get Started</Link>}
				{isAuthenticated && (
					<div className="nav-user">
						<button 
							className="nav-notif-btn" 
							type="button" 
							title="Notifications"
							onClick={onNotificationClick}
						>
							🔔
							{notificationCount > 0 && <span className="notif-badge">{notificationCount}</span>}
						</button>
						<div className="nav-user-info">
							<span className="nav-user-name">{currentUser?.name || "User"}</span>
							<span className="nav-user-role">{currentUser?.role || "Student"}</span>
						</div>
						<button className="nav-logout" type="button" onClick={onLogout}>
							Logout
						</button>
					</div>
				)}
			</div>
		</nav>
	);
}