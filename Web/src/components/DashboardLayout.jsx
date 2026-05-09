import { useContext, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/dashboard.css";

export default function DashboardLayout({ title, children, showProfileCard = true }) {
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
			<Navbar />
			<div className="dashboard-container">
				<Sidebar />
				<main className="dashboard-main">
					{title && <h2>{title}</h2>}
					{showProfileCard && (
						<section className="card">
							<h3>Profile</h3>
							<p>Name: {currentUser?.name || "Guest"}</p>
							<p>Email: {currentUser?.email || "-"}</p>
							<p>Role: {currentUser?.role || "STUDENT"}</p>
						</section>
					)}
					{children}
				</main>
			</div>
		</div>
	);
}