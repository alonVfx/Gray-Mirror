import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { History, Trash2, MessageSquare, Calendar, Users, Play } from 'lucide-react';

const ConversationHistoryInfinite = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref for intersection observer
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadInitialConversations();
    }
  }, [user]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          loadMoreConversations();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore]);

  const loadInitialConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setConversations([]);
      setLastDoc(null);
      setHasMore(true);

      const conversationsRef = collection(db, 'users', user.uid, 'conversations');
      const q = query(
        conversationsRef, 
        orderBy('createdAt', 'desc'), 
        limit(15) // Load more initially for better UX
      );
      
      const snapshot = await getDocs(q);
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      
      setConversations(conversationsData);
      updateCursor(snapshot);
      
    } catch (err) {
      setError(err);
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreConversations = async () => {
    if (!user || !lastDoc || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const conversationsRef = collection(db, 'users', user.uid, 'conversations');
      const q = query(
        conversationsRef, 
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc), // Firestore cursor - start after the last document
        limit(15)
      );
      
      const snapshot = await getDocs(q);
      const newConversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      
      setConversations(prev => [...prev, ...newConversations]);
      updateCursor(snapshot);
      
    } catch (err) {
      setError(err);
      console.error('Error loading more conversations:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateCursor = (snapshot) => {
    const docs = snapshot.docs;
    if (docs.length > 0) {
      // Update cursor to the last document for next page
      setLastDoc(docs[docs.length - 1]);
      // If we got fewer docs than requested, we've reached the end
      setHasMore(docs.length === 15);
    } else {
      setHasMore(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!user || !window.confirm('האם אתה בטוח שברצונך למחוק שיחה זו?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', conversationId));
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If we deleted the last conversation in our list, we might need to reset pagination
      if (conversations.length === 1) {
        setHasMore(true);
        setLastDoc(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('שגיאה במחיקת השיחה');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'תאריך לא ידוע';
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            שגיאה בטעינת השיחות: {error.message}
          </p>
          <button
            onClick={loadInitialConversations}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <History className="h-6 w-6 ml-2" />
            היסטוריית שיחות (Infinite Scroll)
          </h2>
          <button
            onClick={loadInitialConversations}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
          >
            רענן
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="p-6">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              אין שיחות קודמות
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              התחל שיחה חדשה כדי לראות אותה כאן
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation, index) => (
              <div
                key={conversation.id}
                className={`p-4 rounded-lg border ${
                  selectedConversation?.id === conversation.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(conversation.createdAt)}
                      </span>
                    </div>
                    
                    {conversation.scene && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        <strong>סצנה:</strong> {conversation.scene}
                      </p>
                    )}
                    
                    {conversation.participants && (
                      <div className="flex items-center mb-2">
                        <Users className="h-4 w-4 text-gray-400 ml-2" />
                        <div className="flex flex-wrap gap-1">
                          {conversation.participants.slice(0, 3).map((participant, participantIndex) => (
                            <span
                              key={participantIndex}
                              className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                            >
                              {participant.name}
                            </span>
                          ))}
                          {conversation.participants.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{conversation.participants.length - 3} נוספים
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setSelectedConversation(conversation)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                      title="הצג פרטים"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteConversation(conversation.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                      title="מחק שיחה"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load more trigger - invisible element for intersection observer */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {loadingMore && (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 ml-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">טוען עוד שיחות...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasMore && conversations.length > 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  הגעת לסוף הרשימה • {conversations.length} שיחות
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversation Details Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  פרטי השיחה
                </h3>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">תאריך יצירה</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(selectedConversation.createdAt)}
                  </p>
                </div>
                
                {selectedConversation.scene && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">סצנה</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedConversation.scene}
                    </p>
                  </div>
                )}
                
                {selectedConversation.participants && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">משתתפים</h4>
                    <div className="space-y-2">
                      {selectedConversation.participants.map((participant, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {participant.name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {participant.identity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedConversation(null)}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationHistoryInfinite;
