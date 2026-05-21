import React, { useState, useEffect, useRef, useContext } from "react";
import { collection, query, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import AuthContext from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

export default function ChatWindow({ otherUser, onClose }) {
  const { currentUser } = useContext(AuthContext);
  const { sendMessage, markAsRead, recentChats, activeChat } = useChat();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  // Normalize emails
  const myEmail = currentUser?.email?.toLowerCase();
  const theirEmail = otherUser?.email?.toLowerCase();
  const participants = [myEmail, theirEmail].filter(Boolean).sort();
  const chatId = participants.join("_").replace(/\./g, ",");

  // Find this specific chat in recentChats to get unread stats
  const currentChatData = recentChats.find(c => c.id === chatId);
  
  // A message is "seen" by the other user if THEIR unread count for this chat is 0
  // and the last message in the chat was sent by the current user.
  const isOtherUserRead = currentChatData?.unreadCount && 
                         currentChatData.unreadCount[theirEmail] === 0 &&
                         currentChatData.lastMessageSender === myEmail;

  // Mark as read when the window is active and messages change
  useEffect(() => {
    if (theirEmail && activeChat?.email?.toLowerCase() === theirEmail) {
      markAsRead(theirEmail);
    }
  }, [theirEmail, messages.length, activeChat, markAsRead]);

  useEffect(() => {
    if (!chatId) return;

    console.log("ChatWindow: Subscribing to messages at path:", `chats/${chatId}/messages`);
    const messagesRef = collection(db, "chats", chatId, "messages");

    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      console.log("%cChatWindow: SNAPSHOT RECEIVED!", "background: #39c6b8; color: white; font-size: 16px; padding: 5px;");
      console.log("ChatWindow: Path checked:", messagesRef.path);
      console.log("ChatWindow: Number of documents found:", snapshot.docs.length);

      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("ChatWindow: Found Message Data:", data);
        return {
          id: doc.id,
          ...data
        };
      });

      // Sort manually by timestamp to avoid indexing issues
      msgs.sort((a, b) => {
        const getMillis = (ts) => {
          if (!ts) return Date.now() + 10000; // Future timestamp for unsent/pending messages
          if (ts.toMillis) return ts.toMillis();
          if (ts.seconds) return ts.seconds * 1000;
          if (ts instanceof Date) return ts.getTime();
          return Date.now() + 10000;
        };
        return getMillis(a.timestamp) - getMillis(b.timestamp);
      });

      console.log("ChatWindow: Final messages list:", msgs);
      setMessages(msgs);
    }, (err) => {
      console.error("%cChatWindow: FIRESTORE ERROR!", "background: red; color: white; font-size: 16px; padding: 5px;");
      console.error("ChatWindow: Error details:", err);
      console.error("ChatWindow: Error code:", err.code);
      console.error("ChatWindow: Error message:", err.message);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(otherUser, inputText);
    setInputText("");
  };

  if (!chatId) return null;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">{(otherUser?.name || "U").charAt(0)}</div>
          <div>
            <div className="chat-name">{otherUser?.name || "User"}</div>
            <div className="chat-status">{otherUser?.role || "Contact"}</div>
          </div>
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-messages">No messages yet. Say hello!</div>
        )}
        {messages.map((msg, index) => {
          const isLastMessage = index === messages.length - 1;
          const isSentByMe = msg.sender === myEmail;
          
          // Check if chat unread count for the OTHER user is 0
          // This would ideally come from the parent chat document
          // For now, we'll simplify and show 'Seen' if the message is NOT the last one sent by me, 
          // or if we have a way to track the other user's read state.
          
          return (
            <div 
              key={msg.id} 
              className={`message-bubble ${isSentByMe ? "sent" : "received"}`}
            >
              <div className="message-text">{msg.text}</div>
              <div className="message-footer">
                <span className="message-time">
                  {msg.timestamp?.toDate ? 
                    msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                    "..."}
                </span>
                {isSentByMe && isLastMessage && isOtherUserRead && (
                  <span className="message-status">Seen</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" disabled={!inputText.trim()} title="Send Message">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
