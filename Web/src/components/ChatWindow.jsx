import React, { useState, useEffect, useRef, useContext } from "react";
import { collection, query, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import AuthContext from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

export default function ChatWindow({ otherUser, onClose }) {
  const { currentUser } = useContext(AuthContext);
  const { sendMessage } = useChat();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  // Normalize emails to ensure matching IDs
  const myEmail = currentUser?.email?.toLowerCase();
  const theirEmail = otherUser?.email?.toLowerCase();
  const participants = [myEmail, theirEmail].filter(Boolean).sort();
  const chatId = participants.length === 2 ? participants.join("_").replace(/\./g, ",") : null;

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort manually by timestamp to avoid indexing issues
      msgs.sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0);
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0);
        return tA - tB;
      });

      setMessages(msgs);
    }, (err) => {
      console.error("ChatWindow: Firestore Error:", err);
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
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-bubble ${msg.sender === myEmail ? "sent" : "received"}`}
          >
            <div className="message-text">{msg.text}</div>
            <div className="message-time">
              {msg.timestamp?.toDate ? 
                msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                "..."}
            </div>
          </div>
        ))}
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" disabled={!inputText.trim()}>Send</button>
      </form>
    </div>
  );
}
