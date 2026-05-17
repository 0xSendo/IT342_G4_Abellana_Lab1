import { useContext, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/dashboard.css";

export default function DashboardLayout({ title, children, showProfileCard = true, onNotificationClick, notificationCount }) {
	const { currentUser, logout } = useContext(AuthContext);
	const toast = useToast();

	// Handle back button to prevent accidental exit
	useEffect(() => {
		let isMounted = true;
		
		const handlePopState = (e) => {
			if (!isMounted) return;
			// If user tries to go back, we push the state again to stay on this page
			// and show the confirmation toast.
			window.history.pushState(null, null, window.location.pathname);
			toast.show("Use the Logout button to exit safely.", "info");
		};

		// Push an initial state only once when the dashboard mounts
		window.history.pushState(null, null, window.location.pathname);

		window.addEventListener("popstate", handlePopState);
		return () => {
			isMounted = false;
			window.removeEventListener("popstate", handlePopState);
		};
	}, [toast]);

	return (
		<div style={{ width: "100%" }}>
			<Navbar onNotificationClick={onNotificationClick} notificationCount={notificationCount} />
			<div className="dashboard-container">
				<Sidebar />
				<main className="dashboard-main">
					{title && <h2 style={{ display: 'none' }}>{title}</h2>}
					{children}
				</main>
			</div>
		</div>
	);
}