import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "../firebase";
import AuthContext from "./AuthContext";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { currentUser } = useContext(AuthContext);
  const [openChats, setOpenChats] = useState([]); 
  const [activeChat, setActiveChat] = useState(null); 
  const [recentChats, setRecentChats] = useState([]); 
  const [isChatListOpen, setIsChatListOpen] = useState(false);

  // Authenticate with Firebase anonymously to allow Firestore access
  useEffect(() => {
    if (currentUser) {
      signInAnonymously(auth)
        .then(() => console.log("Firebase: Authenticated anonymously"))
        .catch(err => console.error("Firebase Auth Error:", err));
    }
  }, [currentUser]);

  // Fetch recent chats for the current user
  useEffect(() => {
    if (!currentUser?.email) return;

    // Note: This query may require a composite index in Firestore.
    // Check browser console for a Firebase link to create it if it fails.
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.email),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentChats(chats);
    }, (err) => {
      console.error("Firestore Recent Chats Error:", err);
      // If index is missing, we might need a simpler query or tell user
    });

    return () => unsubscribe();
  }, [currentUser]);

  const openChatWith = (otherUser) => {
    if (!otherUser?.email) {
      console.warn("Chat: Cannot open chat, other user has no email", otherUser);
      return;
    }
    
    setOpenChats(prev => {
      if (prev.find(c => c.email === otherUser.email)) return prev;
      return [...prev, otherUser].slice(-3);
    });
    setActiveChat(otherUser);
    setIsChatListOpen(false);
  };

  const closeChat = (email) => {
    setOpenChats(prev => prev.filter(c => c.email !== email));
    if (activeChat?.email === email) {
      setActiveChat(null);
    }
  };

  const sendMessage = async (otherUser, text) => {
    console.log("Chat: Attempting to send message to", otherUser?.email);
    if (!text.trim() || !currentUser?.email || !otherUser?.email) {
      console.warn("Chat: Send failed - Missing data", { 
        text: !!text.trim(), 
        currentUser: !!currentUser?.email, 
        otherUser: !!otherUser?.email 
      });
      return;
    }

    try {
      // Normalize emails to lowercase
      const myEmail = currentUser.email.toLowerCase();
      const theirEmail = otherUser.email.toLowerCase();
      
      const participants = [myEmail, theirEmail].sort();
      const chatId = participants.join("_").replace(/\./g, ",");
      console.log("Chat: Using Chat ID:", chatId);
      
      const chatRef = doc(db, "chats", chatId);
      
      const chatData = {
        participants,
        participantNames: {
          [myEmail]: currentUser.name || myEmail,
          [theirEmail]: otherUser.name || theirEmail
        },
        participantRoles: {
          [myEmail]: currentUser.role || "User",
          [theirEmail]: otherUser.role || "User"
        },
        lastMessage: text,
        lastMessageSender: myEmail,
        lastMessageTimestamp: serverTimestamp()
      };
      
      await setDoc(chatRef, chatData, { merge: true });

      await addDoc(collection(chatRef, "messages"), {
        text,
        sender: myEmail,
        timestamp: serverTimestamp()
      });
      
      console.log("Chat: Message recorded successfully");
    } catch (err) {
      console.error("Chat: Error in sendMessage:", err);
    }
  };

  const value = {
    openChats,
    activeChat,
    recentChats,
    isChatListOpen,
    setIsChatListOpen,
    openChatWith,
    closeChat,
    setActiveChat,
    sendMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);
export default ChatContext;
