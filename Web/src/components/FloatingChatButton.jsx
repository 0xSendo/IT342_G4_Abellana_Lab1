import React, { useContext } from "react";
import { useChat } from "../context/ChatContext";
import AuthContext from "../context/AuthContext";
import ChatWindow from "./ChatWindow";
import "../styles/chat.css";

export default function FloatingChatButton() {
  const { currentUser } = useContext(AuthContext);
  const { 
    openChats, 
    closeChat, 
    recentChats, 
    isChatListOpen, 
    setIsChatListOpen, 
    openChatWith,
    unreadCounts,
    markAsRead
  } = useChat();

  if (!currentUser) return null;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const handleOpenChat = (user) => {
    openChatWith(user);
    markAsRead(user.email);
  };

  return (
    <div className="chat-global-container">
      {/* Active Chat Windows - Stacked at the bottom right */}
      <div className="active-chats-row">
        {openChats.map(user => (
          <ChatWindow 
            key={user.email} 
            otherUser={user} 
            onClose={() => closeChat(user.email)} 
          />
        ))}
      </div>

      {/* Chat List Popup */}
      {isChatListOpen && (
        <div className="chat-list-popup">
          <div className="chat-list-header">
            <h3>Recent Messages</h3>
            <button className="close-popup" onClick={() => setIsChatListOpen(false)}>✕</button>
          </div>
          <div className="chat-list-body">
            {recentChats.length === 0 ? (
              <div className="empty-chats">No conversations yet</div>
            ) : (
              recentChats.map(chat => {
                const otherEmail = chat.participants.find(p => p !== currentUser.email);
                const otherName = chat.participantNames[otherEmail] || otherEmail;
                
                const unreadCount = unreadCounts[otherEmail] || 0;
                
                return (
                  <div 
                    key={chat.id} 
                    className={`recent-chat-item ${unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => handleOpenChat({ email: otherEmail, name: otherName })}
                  >
                    <div className="recent-chat-avatar">
                      {otherName.charAt(0)}
                      {unreadCount > 0 && <span className="unread-dot"></span>}
                    </div>
                    <div className="recent-chat-info">
                      <div className="recent-chat-name">
                        {otherName}
                        {unreadCount > 0 && <span className="unread-count-pill">{unreadCount}</span>}
                      </div>
                      <div className="recent-chat-last">{chat.lastMessage}</div>
                    </div>
                    <div className="recent-chat-time">
                      {chat.lastMessageTimestamp?.toDate() ? 
                        new Date(chat.lastMessageTimestamp.toDate()).toLocaleDateString() : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        className={`floating-chat-btn ${isChatListOpen ? 'active' : ''}`} 
        onClick={() => setIsChatListOpen(!isChatListOpen)}
        title="Messages"
      >
        <span className="chat-icon">💬</span>
        {totalUnread > 0 && <span className="notification-badge">{totalUnread}</span>}
      </button>
    </div>
  );
}
