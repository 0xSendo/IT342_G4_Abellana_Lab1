import { useContext } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AuthContext from "../context/AuthContext";
import "../styles/dashboard.css";

export default function DashboardLayout({ title, children }) {
	const { currentUser } = useContext(AuthContext);

	return (
		<div>
			<Navbar />
			<div className="dashboard-container" style={{ paddingTop: 64 }}>
				<Sidebar />
				<main className="dashboard-main">
					<h2>{title}</h2>
					<section className="card">
						<h3>Profile</h3>
						<p>Name: {currentUser?.name || "Guest"}</p>
						<p>Email: {currentUser?.email || "-"}</p>
						<p>Role: {currentUser?.role || "STUDENT"}</p>
					</section>
					{children}
				</main>
			</div>
		</div>
	);
}

