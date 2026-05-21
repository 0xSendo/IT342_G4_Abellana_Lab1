import React, { useContext, useState, useEffect, useRef } from "react";
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
    unreadCounts
  } = useChat();

  // Draggable State
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickPrevented, setClickPrevented] = useState(false);
  
  const buttonRef = useRef(null);

  if (!currentUser) return null;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Dragging Handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setClickPrevented(false);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Determine if movement is enough to prevent a click action
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setClickPrevented(true);
    }

    // Bounds checking
    const boundedX = Math.max(10, Math.min(window.innerWidth - 75, newX));
    const boundedY = Math.max(10, Math.min(window.innerHeight - 75, newY));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
    
    // Toggle list ONLY if it wasn't a significant drag
    if (!clickPrevented) {
      setIsChatListOpen(!isChatListOpen);
    }
  };

  const handleOpenChat = (user) => {
    openChatWith(user);
    setIsChatListOpen(false);
  };

  // Adjust position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(window.innerWidth - 85, prev.x),
        y: Math.min(window.innerHeight - 85, prev.y)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Popup Position Logic
  const popupStyle = {
    left: position.x - 360,
    top: position.y - 450,
  };

  // Keep popup within viewport
  if (popupStyle.left < 20) popupStyle.left = position.x + 80;
  if (popupStyle.top < 20) popupStyle.top = position.y + 80;

  return (
    <div className="chat-global-container">
      {/* Active Chat Windows */}
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
        <div className="chat-list-popup" style={popupStyle}>
          <div className="chat-list-header">
            <h3>Recent Messages</h3>
            <button className="close-popup" onClick={() => setIsChatListOpen(false)}>✕</button>
          </div>
          <div className="chat-list-body">
            {recentChats.length === 0 ? (
              <div className="empty-chats" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No conversations yet</div>
            ) : (
              recentChats.map(chat => {
                const otherEmail = chat.participants.find(p => p !== currentUser.email.toLowerCase());
                const otherName = chat.participantNames[otherEmail] || otherEmail;
                const unreadCount = unreadCounts[otherEmail] || 0;
                
                return (
                  <div 
                    key={chat.id} 
                    className={`recent-chat-item ${unreadCount > 0 ? 'unread' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChat({ email: otherEmail, name: otherName });
                    }}
                  >
                    <div className="recent-chat-avatar">
                      {otherName.charAt(0).toUpperCase()}
                    </div>
                    <div className="recent-chat-info">
                      <div className="recent-chat-name">
                        <span>{otherName}</span>
                        {unreadCount > 0 && <span className="unread-count-pill">{unreadCount}</span>}
                      </div>
                      <div className="recent-chat-last">{chat.lastMessage}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Floating Draggable Button */}
      <button 
        ref={buttonRef}
        className={`floating-chat-btn ${isChatListOpen ? 'active' : ''}`} 
        style={{ 
          left: position.x, 
          top: position.y,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Drag me anywhere!"
      >
        <span className="chat-icon">{isChatListOpen ? '✕' : '💬'}</span>
        {totalUnread > 0 && !isChatListOpen && (
          <span className="notification-badge">{totalUnread}</span>
        )}
      </button>
    </div>
  );
}
