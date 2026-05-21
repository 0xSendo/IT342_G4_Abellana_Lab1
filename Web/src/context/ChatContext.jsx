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
  getDoc,
  updateDoc
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "../firebase";
import AuthContext from "./AuthContext";
import { useToast } from "./ToastContext";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();
  const [openChats, setOpenChats] = useState(() => {
    const saved = localStorage.getItem("internmatch_openChats");
    return saved ? JSON.parse(saved) : [];
  }); 
  const [activeChat, setActiveChat] = useState(() => {
    const saved = localStorage.getItem("internmatch_activeChat");
    return saved ? JSON.parse(saved) : null;
  }); 
  const [recentChats, setRecentChats] = useState([]); 
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // { otherUserEmail: count }
  const [lastMessages, setLastMessages] = useState([]); // Array of timestamps for rate limiting

  // Clear chat state on logout
  useEffect(() => {
    if (!currentUser) {
      setOpenChats([]);
      setActiveChat(null);
      setRecentChats([]);
      localStorage.removeItem("internmatch_openChats");
      localStorage.removeItem("internmatch_activeChat");
    }
  }, [currentUser]);

  // Persist open chats
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("internmatch_openChats", JSON.stringify(openChats));
    }
  }, [openChats, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("internmatch_activeChat", JSON.stringify(activeChat));
    }
  }, [activeChat, currentUser]);

  // Update unread counts based on recentChats
  useEffect(() => {
    if (!currentUser?.email) return;
    const myEmail = currentUser.email.toLowerCase();
    const counts = {};
    
    recentChats.forEach(chat => {
      // Find the other participant's email (normalized)
      const otherEmail = chat.participants.find(p => p !== myEmail);
      if (!otherEmail) return;

      // Get unread count for the current user in this chat
      const unread = chat.unreadCount?.[myEmail] || 0;
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

    const normalizedEmail = currentUser.email.toLowerCase();
    console.log("ChatContext: Fetching recent chats for:", normalizedEmail);

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", normalizedEmail),
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
    });

    return () => unsubscribe();
  }, [currentUser]);

  const openChatWith = (otherUser) => {
    if (!otherUser?.email) {
      console.warn("Chat: Cannot open chat, other user has no email", otherUser);
      return;
    }
    
    const otherEmail = otherUser.email.toLowerCase();
    setOpenChats(prev => {
      // Robust check: find by email and ignore casing/object structure differences
      const exists = prev.some(c => c.email && c.email.toLowerCase() === otherEmail);
      if (exists) return prev;
      return [...prev, otherUser].slice(-3);
    });
    setActiveChat(otherUser);
    setIsChatListOpen(false);
    
    // Immediately mark as read when opening
    markAsRead(otherEmail);
  };

  const closeChat = (email) => {
    const targetEmail = email.toLowerCase();
    setOpenChats(prev => prev.filter(c => c.email.toLowerCase() !== targetEmail));
    if (activeChat?.email?.toLowerCase() === targetEmail) {
      setActiveChat(null);
    }
  };

  const markAsRead = async (otherUserEmail) => {
    if (!currentUser?.email || !otherUserEmail) return;
    
    const myEmail = currentUser.email.toLowerCase();
    const theirEmail = otherUserEmail.toLowerCase();
    const participants = [myEmail, theirEmail].sort();
    const chatId = participants.join("_").replace(/\./g, ",");
    
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        const currentUnreadForMe = data.unreadCount?.[myEmail] || 0;
        
        if (currentUnreadForMe > 0) {
          // Update Firestore
          await updateDoc(chatRef, {
            [`unreadCount.${myEmail}`]: 0
          });
          
          // Optimistically update local state to provide immediate feedback
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[theirEmail];
            return newCounts;
          });
          
          console.log(`Chat: Marked as read for ${myEmail}`);
        }
      }
    } catch (err) {
      console.error("Chat: Error marking as read:", err);
    }
  };

  const sendMessage = async (otherUser, text) => {
    if (!text.trim() || !currentUser?.email || !otherUser?.email) return;

    // --- Anti-Spam Logic ---
    const now = Date.now();
    const SPAM_THRESHOLD_MS = 10000; // 10 seconds
    const MAX_MESSAGES = 5;

    // Filter out messages older than the threshold
    const recentMessageTimestamps = lastMessages.filter(ts => now - ts < SPAM_THRESHOLD_MS);
    
    if (recentMessageTimestamps.length >= MAX_MESSAGES) {
      toast.show("Slow down! You are sending messages too fast.", { type: "warning" });
      console.warn("Chat: Message blocked - Rate limit exceeded");
      return;
    }

    // Duplicate Check
    const lastMsgRef = localStorage.getItem(`last_msg_${otherUser.email.toLowerCase()}`);
    if (lastMsgRef === text.trim()) {
      toast.show("Duplicate message detected.", { type: "warning" });
      return;
    }

    // Update rate limiting state
    setLastMessages([...recentMessageTimestamps, now]);
    localStorage.setItem(`last_msg_${otherUser.email.toLowerCase()}`, text.trim());
    // --- End Anti-Spam Logic ---

    // Advanced Link Censorship Logic
    // 1. Detect direct links
    const directUrlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?)/i;
    
    // 2. Detect highly obfuscated links (e.g., "u (tube) dat come", "google [dot] com")
    // Normalize phonetically and visually
    const normalizedText = text.toLowerCase()
      // Replace phonetic dots/separators
      .replace(/\s*(?:\[dot\]|\(dot\)|<dot>|\{dot\}|\.dot\.|dot|d0t|period|dat|at)\s*/g, ".")
      // Replace phonetic TLDs
      .replace(/\s*(?:come|c0m|cm)\b/g, "com")
      .replace(/\s*(?:n3t|net)\b/g, "net")
      .replace(/\s*(?:0rg|org)\b/g, "org")
      // Remove all remaining whitespace and noise
      .replace(/\s+/g, "")
      .replace(/[\[\]\(\)\{\}<>]/g, "");

    // Check for pattern: something.commonTld
    const commonTlds = ["com", "net", "org", "io", "gov", "edu", "ph", "link", "me", "xyz"];
    const tldPattern = commonTlds.join("|");
    const obfuscatedUrlRegex = new RegExp(`[a-z0-9-]+\\.(?:${tldPattern})`, "i");

    if (directUrlRegex.test(text) || obfuscatedUrlRegex.test(normalizedText)) {
      toast.show("Links are prohibited", { type: "error" });
      console.warn("Chat: Message blocked - contains a potential link (Fuzzy Match)");
      return;
    }

    try {
      const myEmail = currentUser.email.toLowerCase();
      const theirEmail = otherUser.email.toLowerCase();
      
      const participants = [myEmail, theirEmail].sort();
      const chatId = participants.join("_").replace(/\./g, ",");
      
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      // Get current unread counts to preserve them
      const existingData = chatSnap.exists() ? chatSnap.data() : {};
      const currentUnreadCounts = existingData.unreadCount || {};
      const recipientUnread = currentUnreadCounts[theirEmail] || 0;

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
          ...currentUnreadCounts,
          [theirEmail]: recipientUnread + 1,
          [myEmail]: 0 // Sender always has 0 unread for their own sent message
        }
      };
      
      // Atomic update of the chat document
      await setDoc(chatRef, chatData, { merge: true });

      // Add message to history sub-collection
      const messagesCollectionRef = collection(chatRef, "messages");
      await addDoc(messagesCollectionRef, {
        text,
        sender: myEmail,
        timestamp: serverTimestamp()
      });

      console.log("Chat: Message sent and unread count updated.");
    } catch (err) {
      console.error("Chat: Error in sendMessage:", err);
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
