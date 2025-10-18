import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit,
  startAfter,
  onSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Custom hook for paginated chat messages with real-time updates
 * Optimized for chat where new messages come at the bottom
 * and we want to load older messages on demand
 */
export const useChatMessagesPagination = (userId, conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const lastDocRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Load initial messages (most recent)
  const loadInitialMessages = useCallback(async () => {
    if (!userId || !conversationId || isInitializedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      
      const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef, 
        orderBy('timestamp', 'desc'), // Most recent first for initial load
        limit(20) // Load last 20 messages
      );
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.reverse(); // Reverse to show chronological order
      
      const newMessages = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
        };
      });

      setMessages(newMessages);
      lastDocRef.current = docs[docs.length - 1] || null;
      setHasMore(docs.length === 20);
      isInitializedRef.current = true;
      
    } catch (err) {
      setError(err);
      console.error('Error loading initial messages:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, conversationId]);

  // Load older messages (pagination backward in time)
  const loadMoreMessages = useCallback(async () => {
    if (!userId || !conversationId || loadingMore || !hasMore || !lastDocRef.current) return;

    try {
      setLoadingMore(true);
      setError(null);
      
      const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef, 
        orderBy('timestamp', 'desc'),
        startAfter(lastDocRef.current), // Cursor: start after the oldest message we have
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.reverse(); // Reverse for chronological order
      
      const olderMessages = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
        };
      });

      setMessages(prev => [...olderMessages, ...prev]); // Add to beginning
      lastDocRef.current = docs[docs.length - 1] || null;
      setHasMore(docs.length === 20);
      
    } catch (err) {
      setError(err);
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, conversationId, loadingMore, hasMore]);

  // Setup real-time listener for new messages
  const setupRealtimeListener = useCallback(() => {
    if (!userId || !conversationId || !isInitializedRef.current) return;

    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef, 
      orderBy('timestamp', 'asc') // Listen in ascending order for new messages
    );

    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
        };
      });

      // Only update if we have new messages or if this is a fresh load
      setMessages(prevMessages => {
        const lastMessageId = prevMessages[prevMessages.length - 1]?.id;
        const lastNewMessageIndex = newMessages.findIndex(msg => msg.id === lastMessageId);
        
        // If we found our last message, only add messages after it
        if (lastNewMessageIndex >= 0) {
          const trulyNewMessages = newMessages.slice(lastNewMessageIndex + 1);
          return [...prevMessages, ...trulyNewMessages];
        }
        
        // If no last message found, we might be in initial load state
        return newMessages;
      });
    }, (err) => {
      console.error('Error in real-time listener:', err);
      setError(err);
    });
  }, [userId, conversationId]);

  // Initialize
  useEffect(() => {
    if (!userId || !conversationId) return;

    const initialize = async () => {
      await loadInitialMessages();
      setupRealtimeListener();
    };

    initialize();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      isInitializedRef.current = false;
      lastDocRef.current = null;
    };
  }, [userId, conversationId, loadInitialMessages, setupRealtimeListener]);

  // Reset when conversation changes
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(true);
    setError(null);
    isInitializedRef.current = false;
    lastDocRef.current = null;
  }, [conversationId]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreMessages,
    reset: () => {
      setMessages([]);
      setLoading(true);
      setLoadingMore(false);
      setHasMore(true);
      setError(null);
      isInitializedRef.current = false;
      lastDocRef.current = null;
    }
  };
};

/**
 * Simplified hook for basic chat without pagination (current implementation)
 */
export const useChatMessages = (userId, conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!userId || !conversationId) return;

    const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
        };
      });
      
      setMessages(newMessages);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to messages:', err);
      setError(err);
      setLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, conversationId]);

  return { messages, loading, error };
};
