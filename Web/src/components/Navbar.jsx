import { Link } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "../styles/navbar.css";

export default function Navbar() {
	const { isAuthenticated, currentUser, logout } = useContext(AuthContext);

	const onLogout = () => {
		const confirmed = window.confirm("Are you sure you want to log out?");
		if (!confirmed) return;
		logout();
	};

	return (
		<nav className="navbar">
			<h2>InternMatch</h2>
			<div>
				<Link to="/">Home</Link>
				{!isAuthenticated && <Link to="/login">Login</Link>}
				{!isAuthenticated && <Link className="nav-btn" to="/register">Get Started</Link>}
				{isAuthenticated && (
					<div className="nav-user">
						<span className="nav-user-name">{currentUser?.name || "User"}</span>
						<button className="nav-logout" type="button" onClick={onLogout}>
							Logout
						</button>
					</div>
				)}
			</div>
		</nav>
	);
}

