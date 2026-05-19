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
  const [unreadCounts, setUnreadCounts] = useState({}); // { otherUserEmail: count }

  // Update unread counts based on recentChats
  useEffect(() => {
    if (!currentUser?.email) return;
    const counts = {};
    recentChats.forEach(chat => {
      const otherEmail = chat.participants.find(p => p !== currentUser.email);
      // If there's an unread count stored for the current user in this chat
      const unread = chat.unreadCount?.[currentUser.email] || 0;
      if (unread > 0) {
        counts[otherEmail] = unread;
      }
    });
    setUnreadCounts(counts);
  }, [recentChats, currentUser]);

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

  const markAsRead = async (otherUserEmail) => {
    if (!currentUser?.email || !otherUserEmail) return;
    
    const myEmail = currentUser.email.toLowerCase();
    const theirEmail = otherUserEmail.toLowerCase();
    const chatId = [myEmail, theirEmail].sort().join("_").replace(/\./g, ",");
    
    try {
      const chatRef = doc(db, "chats", chatId);
      await setDoc(chatRef, {
        unreadCount: {
          [myEmail]: 0
        }
      }, { merge: true });
    } catch (err) {
      console.error("Chat: Error marking as read:", err);
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
      
      // Get current unread count for recipient
      const chatSnap = await getDoc(chatRef);
      const currentUnread = chatSnap.exists() ? (chatSnap.data().unreadCount?.[theirEmail] || 0) : 0;

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
        lastMessageTimestamp: serverTimestamp(),
        unreadCount: {
          [theirEmail]: currentUnread + 1
        }
      };
      
      console.log("Chat: Updating chat document at:", chatRef.path);
      await setDoc(chatRef, chatData, { merge: true });
      console.log("Chat: Chat document updated successfully.");

      // Add message to history
      const messagesCollectionRef = collection(chatRef, "messages");
      console.log("Chat: Saving message to path:", messagesCollectionRef.path);

      const msgRef = await addDoc(messagesCollectionRef, {
        text,
        sender: myEmail,
        timestamp: serverTimestamp(),
        read: false
      });

      console.log("Chat: Message saved successfully. ID:", msgRef.id);
    } catch (err) {
      console.error("%cChat: ERROR IN sendMessage!", "background: red; color: white; padding: 5px;");
      console.error("Chat: Error details:", err);
    }
  };

  const value = {
    openChats,
    activeChat,
    recentChats,
    isChatListOpen,
    unreadCounts,
    setIsChatListOpen,
    openChatWith,
    closeChat,
    setActiveChat,
    sendMessage,
    markAsRead
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);
export default ChatContext;
