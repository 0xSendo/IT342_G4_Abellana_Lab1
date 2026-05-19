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
    openChatWith 
  } = useChat();

  if (!currentUser) return null;

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
                
                return (
                  <div 
                    key={chat.id} 
                    className="recent-chat-item"
                    onClick={() => openChatWith({ email: otherEmail, name: otherName })}
                  >
                    <div className="recent-chat-avatar">{otherName.charAt(0)}</div>
                    <div className="recent-chat-info">
                      <div className="recent-chat-name">{otherName}</div>
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
        {/* You could add a count here if you track unread messages */}
      </button>
    </div>
  );
}
