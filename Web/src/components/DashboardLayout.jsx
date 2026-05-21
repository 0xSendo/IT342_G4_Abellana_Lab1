import { useContext, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import FloatingChatButton from "./FloatingChatButton";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import "../styles/common/bento.css";
import "../styles/notifications.css";

export default function DashboardLayout({ title, children, showProfileCard = true }) {
	const { currentUser, logout } = useContext(AuthContext);
	const toast = useToast();
	const { unreadCount, openNotifications, isNotificationsModalOpen, notifications, closeNotifications, clearAllNotifications, deleteNotification, fetchNotifications, respondToRequest } = useNotifications();

	const formatDateTime = (dateStr) => {
		if (!dateStr) return "N/A";
		const d = new Date(dateStr);
		return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
	};

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
			<Navbar onNotificationClick={openNotifications} notificationCount={unreadCount} />
			<div className="dashboard-container">
				<Sidebar />
				<main className="dashboard-main">
					{title && <h2 style={{ display: 'none' }}>{title}</h2>}
					{children}
				</main>
			</div>
			<FloatingChatButton />

			{/* Notifications Modal */}
			{isNotificationsModalOpen && (
				<div className="modal-overlay">
					<div className="modal-content profile-modal-pro">
						<div className="modal-aurora-glow"></div>
						<div className="modal-inner-content">
							<div className="modal-header-pro">
								<div>
									<span className="bento-label">Updates</span>
									<h3>Your Notifications</h3>
								</div>
								{notifications.length > 0 && (
									<button 
										className="btn-secondary-glass" 
										style={{ marginLeft: 'auto', marginRight: '1rem', color: '#ff6b6b', borderColor: 'rgba(255,107,74,0.2)' }}
										onClick={clearAllNotifications}
									>
										Clear All
									</button>
								)}
								<button className="close-btn-glass" onClick={closeNotifications}>✕</button>
							</div>
							<div className="modal-body-pro">
								<div className="notif-modal-list">
									{notifications.length === 0 ? (
										<div className="notif-empty-state">
											<div className="empty-icon">🔔</div>
											<p>You're all caught up!</p>
										</div>
									) : (
										notifications.map((n) => (
											<div key={n.id} className={`notif-item-full ${n.read ? "" : "unread"}`} style={{ position: 'relative' }}>
												<div className="notif-icon-box">
													{(n.title || "").toLowerCase().includes("accept") ? "🎉" : 
													 (n.title || "").toLowerCase().includes("reject") ? "🤝" : "📩"}
												</div>
												<div className="notif-content-full">
													<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
														<h4 className="notif-title-full">{n.title}</h4>
														<button 
															onClick={() => deleteNotification(n.id)}
															style={{ 
																background: 'none', 
																border: 'none', 
																color: 'var(--muted)', 
																cursor: 'pointer',
																padding: '4px',
																fontSize: '1rem',
																opacity: 0.6
															}}
															title="Delete notification"
														>
															✕
														</button>
													</div>
													<p className="notif-msg-full">{n.message}</p>
													{n.type === "CONNECTION_REQUEST" && !n.read && (
														<div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
															<button 
																className="btn-primary-pro" 
																style={{ padding: '4px 12px', fontSize: '0.75rem' }}
																onClick={() => respondToRequest(n.relatedId, 'ACCEPTED')}
															>
																Accept
															</button>
															<button 
																className="btn-secondary-glass" 
																style={{ padding: '4px 12px', fontSize: '0.75rem' }}
																onClick={() => respondToRequest(n.relatedId, 'DECLINED')}
															>
																Decline
															</button>
														</div>
													)}
													<span className="notif-time-full">
														{formatDateTime(n.createdAt)}
													</span>
												</div>
											</div>
										))
									)}
								</div>
							</div>
							<div className="modal-footer-pro">
								<button className="btn-secondary-glass" onClick={closeNotifications}>Close</button>
								<button className="btn-primary-pro" onClick={fetchNotifications}>Refresh</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}