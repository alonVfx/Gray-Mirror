import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { httpsCallable } from 'firebase/functions';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  limit,
  startAfter
} from 'firebase/firestore';
import { db, functions, analytics, logEvent } from '../firebase/config';
import { aiManager, AI_PROVIDERS } from '../config/aiProviders';
import AIProviderSelector from './AIProviderSelector';
import { Send, Mic, MicOff, Volume2, VolumeX, Users, Plus, X, Play, Square, Brain, History, RefreshCw } from 'lucide-react';

const ChatComponent = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState([
    { name: 'אליס', identity: 'מדענית חלל אופטימית' },
    { name: 'בוב', identity: 'אסטרונאוט ציני' }
  ]);
  const [newParticipant, setNewParticipant] = useState({ name: '', identity: '' });
  const [scene, setScene] = useState('תא שליטה של חללית. אזעקה נשמעת.');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentAIProvider, setCurrentAIProvider] = useState('together');
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [conversationSpeed, setConversationSpeed] = useState(3); // Speed control (1-10)
  const [customDelay, setCustomDelay] = useState(3000); // Custom delay in milliseconds
  const messagesEndRef = useRef(null);
  const conversationTimeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation summaries on mount
  useEffect(() => {
    setConversationSummaries(aiManager.getConversationSummary());
  }, []);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Create a new conversation in Firestore
  const createConversation = async () => {
    try {
      const conversationData = {
        participants: participants,
        scene: scene,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isActive: true
      };

      const conversationRef = await addDoc(
        collection(db, 'users', user.uid, 'conversations'),
        conversationData
      );

      console.log('Created conversation:', conversationRef.id);
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  // Listen to messages in real-time
  const listenToMessages = (conversationId) => {
    if (!conversationId || !user) return;

    console.log('Setting up message listener for conversation:', conversationId);
    const messagesRef = collection(db, 'users', user.uid, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      console.log('Snapshot received, docs count:', snapshot.docs.length);
      const newMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
        };
      });
      
      console.log('Processed messages:', newMessages);
      setMessages(newMessages);
      
      // Update conversation history for AI context
      setConversationHistory(newMessages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      })));
      
      // Force scroll to bottom after state update
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });
  };

  // Save a message to Firestore
  const saveMessageToFirestore = async (messageData) => {
    if (!currentConversationId || !user) return;

    try {
      const message = {
        ...messageData,
        timestamp: serverTimestamp(),
        userId: user.uid
      };

      await addDoc(
        collection(db, 'users', user.uid, 'conversations', currentConversationId, 'messages'),
        message
      );
    } catch (error) {
      console.error('Error saving message to Firestore:', error);
    }
  };

  // Load previous conversations
  const loadConversations = async () => {
    if (!user) return;

    try {
      const conversationsRef = collection(db, 'users', user.uid, 'conversations');
      const q = query(conversationsRef, orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Loaded conversations:', conversations);
      return conversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  };

  const participantColors = [
    'bg-blue-200 text-blue-900', 'bg-red-200 text-red-900', 'bg-green-200 text-green-900', 
    'bg-yellow-200 text-yellow-900', 'bg-purple-200 text-purple-900', 'bg-pink-200 text-pink-900',
    'bg-indigo-200 text-indigo-900', 'bg-teal-200 text-teal-900', 'bg-orange-200 text-orange-900'
  ];

  const callGeminiAPI = async (prompt) => {
    try {
      console.log('Calling Gemini API with prompt:', prompt);
      console.log('User authenticated:', !!user);
      console.log('User ID:', user?.uid);
      
      const callGemini = httpsCallable(functions, 'callGemini');
      
      const result = await callGemini({
        prompt: prompt,
        agents: participants,
        conversationHistory: conversationHistory.slice(-10)
      });
      
      console.log('Gemini API response:', result.data);
      
      if (result.data && result.data.response) {
        return result.data.response;
      } else {
        console.warn('Unexpected response format:', result.data);
        return 'תגובה לא צפויה מהמערכת';
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      
      // Return a more detailed error message
      if (error.code === 'unauthenticated') {
        return 'שגיאת אימות - אנא התחבר מחדש';
      } else if (error.code === 'resource-exhausted') {
        return 'הגעת לגבול ההודעות היומי';
      } else {
        return `שגיאה: ${error.message}`;
      }
    }
  };

  const createDirectorPrompt = () => {
    const sceneContext = scene.trim() || "אין סצנה מוגדרת.";
    const history = messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const allParticipants = participants.map(p => `- ${p.name} (${p.identity})`).join('\n');

    return `
      אתה "במאי" של סימולציית צ'אט קבוצתי. תפקידך הוא ליצור שיחה טבעית וזורמת.
      הנה המשתתפים והזהויות שלהם:
      ${allParticipants}

      הסצנה הנוכחית: "${sceneContext}"

      היסטוריית השיחה עד כה:
      ${history}

      בהתבסס על כל המידע, קבע מי המשתתף הבא שידבר ומה הוא יגיד.
      ייתכן שמשתתף יגיב ישירות להודעה האחרונה, יתחיל נושא חדש, או ישאל שאלה.
      התגובה שלך חייבת להיות בפורמט מדויק של שורה אחת:
      שםהדובר: טקסט ההודעה

      לדוגמה: "אליס: אני לא מאמינה שזה קורה!".
      אל תוסיף שום טקסט נוסף. רק שורה אחת בפורמט הזה.
    `;
  };

  const generateNextTurn = async () => {
    if (!isConversationActive || isTyping) return;

    console.log('Generating next turn with AI provider:', currentAIProvider);
    setIsTyping(true);
    setIsLoading(true);

    try {
      const prompt = createDirectorPrompt();
      console.log('Created prompt:', prompt);

      // Use the new AI manager
      const response = await aiManager.generateResponse(prompt, {
        agents: participants,
        conversationHistory: messages.slice(-10).map(msg => ({ 
          sender: msg.sender, 
          text: msg.text 
        }))
      });

      console.log('Received response from AI:', response);

      if (response && typeof response === 'string') {
        const parts = response.split(':');
        console.log('Split response parts:', parts);

        if (parts.length >= 2) {
          const speaker = parts[0].trim();
          const message = parts.slice(1).join(':').trim();
          
          console.log('Speaker:', speaker, 'Message:', message);
          console.log('Available participants:', participants.map(p => p.name));
          
          if (participants.some(p => p.name === speaker)) {
            const newMessage = {
              text: message,
              sender: speaker,
              type: 'ai'
            };
            console.log('Adding new AI message:', newMessage);
            await saveMessageToFirestore(newMessage);
          } else {
            console.warn('Speaker not found in participants:', speaker);
            // Fallback: pick a random participant
            const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
            const fallbackMessage = {
              text: response,
              sender: randomParticipant.name,
              type: 'ai'
            };
            await saveMessageToFirestore(fallbackMessage);
          }
        } else {
          console.warn('Invalid response format:', response);
          // Fallback: pick a random participant and use the full response
          const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
          const fallbackMessage = {
            text: response,
            sender: randomParticipant.name,
            type: 'ai'
          };
          await saveMessageToFirestore(fallbackMessage);
        }
      } else {
        console.warn('No valid response received:', response);
      }
            } catch (error) {
              console.error('Error generating next turn:', error);
              // Add error message to Firestore
              let errorText = 'שגיאה ביצירת תגובה';
              
              if (error.message.includes('unauthenticated')) {
                errorText = 'נדרש להתחבר מחדש למערכת';
              } else if (error.message.includes('resource-exhausted')) {
                errorText = 'הגעת למגבלת ההודעות היומית';
              } else if (error.message.includes('API error')) {
                errorText = 'בעיה בחיבור ל-AI. נסה שוב בעוד כמה דקות';
              } else {
                errorText = `שגיאה: ${error.message}`;
              }
              
              const errorMessage = {
                text: errorText,
                sender: 'מערכת',
                type: 'error'
              };
              await saveMessageToFirestore(errorMessage);
            }

    setIsTyping(false);
    setIsLoading(false);
    
    if (isConversationActive) {
      // Calculate delay based on speed setting
      const baseDelay = customDelay;
      const randomVariation = baseDelay * 0.3; // 30% variation
      const finalDelay = baseDelay + (Math.random() * randomVariation * 2 - randomVariation);
      
      conversationTimeoutRef.current = setTimeout(generateNextTurn, finalDelay);
    }
  };

  const addParticipant = () => {
    const { name, identity } = newParticipant;
    if (name.trim() && identity.trim()) {
      if (participants.length >= 10) {
        alert('ניתן להוסיף עד 10 משתתפים.');
        return;
      }
      if (participants.some(p => p.name === name)) {
        alert('משתתף עם שם זהה כבר קיים.');
        return;
      }
      setParticipants(prev => [...prev, { name: name.trim(), identity: identity.trim() }]);
      setNewParticipant({ name: '', identity: '' });
    } else {
      alert('יש למלא שם וזהות.');
    }
  };

  const removeParticipant = (index) => {
    if (isConversationActive) {
      alert('לא ניתן להסיר משתתפים בזמן שיחה פעילה.');
      return;
    }
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const startStopConversation = async () => {
    if (isConversationActive) {
      // Stop conversation
      setIsConversationActive(false);
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      setIsTyping(false);
      setIsLoading(false);
      
      // Unsubscribe from messages
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      setCurrentConversationId(null);
      setMessages([]);
      
      // Track conversation stop
      if (analytics) {
        logEvent(analytics, 'conversation_stopped', {
          participants_count: participants.length,
          messages_count: messages.length
        });
      }
    } else {
      // Start conversation
      if (participants.length < 2) {
        alert('יש להוסיף לפחות שני משתתפים.');
        return;
      }
      
      // Check quota for free users
      if (user?.plan === 'free' && user?.quota?.messagesUsedToday >= user?.quota?.messagesLimitDaily) {
        alert('הגעת לגבול ההודעות החינמיות. שדרג ל-Premium להמשך השימוש.');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Create conversation in Firestore
        const conversationId = await createConversation();
        setCurrentConversationId(conversationId);
        
        // Start listening to messages
        listenToMessages(conversationId);
        
        // Add scene message
        const sceneMessage = {
          text: scene.trim() || 'השיחה מתחילה ללא סצנה מוגדרת.',
          sender: 'סצנה',
          type: 'scene'
        };
        
        await saveMessageToFirestore(sceneMessage);
        
        setIsConversationActive(true);
        
        // Track conversation start
        if (analytics) {
          logEvent(analytics, 'conversation_started', {
            participants_count: participants.length,
            scene_length: scene.trim().length,
            user_plan: user?.plan || 'unknown'
          });
        }
        
        // Start AI conversation after a delay
        setTimeout(generateNextTurn, 2000);
        
      } catch (error) {
        console.error('Error starting conversation:', error);
        alert('שגיאה בהתחלת השיחה. אנא נסה שוב.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const sendUserMessage = async () => {
    if (!inputMessage.trim() || isTyping || !currentConversationId) return;
    
    // Check quota for free users
    if (user?.plan === 'free' && user?.quota?.messagesUsedToday >= user?.quota?.messagesLimitDaily) {
      alert('הגעת לגבול ההודעות החינמיות. שדרג ל-Premium להמשך השימוש.');
      return;
    }

    try {
      const userMessage = {
        text: inputMessage,
        sender: 'user',
        type: 'user'
      };

      // Save user message to Firestore
      await saveMessageToFirestore(userMessage);
      
      setInputMessage('');
      setIsLoading(true);

      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      
      // Generate AI response
      await generateNextTurn();
      
    } catch (error) {
      console.error('Error sending user message:', error);
      // Add error message to Firestore
      const errorMessage = {
        text: 'שגיאה בשליחת הודעה. אנא נסה שוב.',
        sender: 'מערכת',
        type: 'error'
      };
      await saveMessageToFirestore(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateScene = () => {
    if (!isConversationActive) {
      alert('יש להתחיל את השיחה כדי לעדכן את הסצנה.');
      return;
    }
    const sceneText = scene.trim();
    if (sceneText) {
      const sceneMessage = {
        id: Date.now(),
        text: sceneText,
        sender: 'סצנה',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, sceneMessage]);
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      generateNextTurn();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  const startRecording = () => {
    setIsRecording(true);
    // Voice recording logic would go here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Stop recording and process audio
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[85vh] min-h-[700px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">סימולטור צ'אט קבוצתי</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
                    {/* AI Provider Selector */}
                    <AIProviderSelector
                      currentProvider={currentAIProvider}
                      onProviderChange={setCurrentAIProvider}
                    />

                    {/* Speed Control */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <label className="text-xs text-gray-600 dark:text-gray-400">מהירות:</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={conversationSpeed}
                        onChange={(e) => {
                          const speed = parseInt(e.target.value);
                          setConversationSpeed(speed);
                          // Convert speed (1-10) to delay (5000-500ms)
                          const newDelay = 5500 - (speed * 500);
                          setCustomDelay(newDelay);
                        }}
                        className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        title={`מהירות שיחה: ${conversationSpeed}/10`}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[60px]">
                        {(customDelay / 1000).toFixed(1)}s
                      </span>
                    </div>

                    {/* Test API Button */}
                    <button
                      onClick={async () => {
                        try {
                          console.log('Testing API connectivity...');
                          const testResponse = await aiManager.generateResponse('בדיקה - האם AI עובד?', {
                            agents: participants,
                            conversationHistory: []
                          });
                          console.log('Test response:', testResponse);
                          const testMessage = {
                            text: `בדיקה: ${testResponse}`,
                            sender: 'מערכת בדיקה',
                            type: 'test'
                          };
                          await saveMessageToFirestore(testMessage);
                        } catch (error) {
                          console.error('Test failed:', error);
                          const errorMessage = {
                            text: `בדיקה נכשלה: ${error.message}`,
                            sender: 'מערכת',
                            type: 'error'
                          };
                          await saveMessageToFirestore(errorMessage);
                        }
                      }}
                      className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                      title="בדיקת חיבור AI"
                    >
                      🔧
                    </button>
            
            {/* Memory Panel Toggle */}
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              className={`p-2 rounded-full ${
                showMemoryPanel 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="ניהול זיכרון השיחה"
            >
              <Brain className="h-5 w-5" />
            </button>
            
            {/* Voice Toggle */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full ${
                voiceEnabled 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="הפעל/כבה קול"
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Memory Panel */}
      {showMemoryPanel && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Brain className="h-5 w-5 ml-2" />
              ניהול זיכרון השיחה
            </h3>
            <button
              onClick={() => setShowMemoryPanel(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Provider Info */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                ספק AI נוכחי
              </h4>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-2xl">
                  {AI_PROVIDERS[currentAIProvider.toUpperCase()]?.icon || '🤖'}
                </span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {AI_PROVIDERS[currentAIProvider.toUpperCase()]?.name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {messages.length} הודעות בשיחה
                  </div>
                </div>
              </div>
            </div>
            
            {/* Memory Stats */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                סטטיסטיקות זיכרון
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">הודעות פעילות:</span>
                  <span className="font-medium">{aiManager.memory.messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">סיכומים:</span>
                  <span className="font-medium">{aiManager.memory.summaries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">גודל חלון:</span>
                  <span className="font-medium">20 הודעות</span>
                </div>
              </div>
            </div>
            
            {/* Memory Actions */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                פעולות זיכרון
              </h4>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      await aiManager.createConversationSummary();
                      setConversationSummaries(aiManager.getConversationSummary());
                    } catch (error) {
                      console.error('Error creating summary:', error);
                    }
                  }}
                  className="w-full px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                >
                  צור סיכום שיחה
                </button>
                <button
                  onClick={() => {
                    aiManager.startNewConversation();
                    setMessages([]);
                    setConversationHistory([]);
                  }}
                  className="w-full px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  התחל שיחה חדשה
                </button>
              </div>
            </div>
          </div>
          
          {/* Conversation Summaries */}
          {conversationSummaries.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                סיכומי שיחות קודמות
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {conversationSummaries.map((summary, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {new Date(summary.timestamp).toLocaleString('he-IL')}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {summary.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        {/* Participants Management */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Users className="h-4 w-4 ml-2" />
            ניהול משתתפים ({participants.length}/10)
          </h3>
          <div className="max-h-32 overflow-y-auto mb-2 space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded-md bg-white border">
                <div>
                  <span className="font-bold text-sm">{participant.name}</span>
                  <span className="text-xs text-gray-600 mr-2">: {participant.identity}</span>
                </div>
                <button
                  onClick={() => removeParticipant(index)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label htmlFor="participant-name" className="sr-only">שם משתתף</label>
              <input
                id="participant-name"
                type="text"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="שם"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="participant-identity" className="sr-only">זהות משתתף</label>
              <input
                id="participant-identity"
                type="text"
                value={newParticipant.identity}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, identity: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="זהות"
              />
            </div>
          </div>
          <button
            onClick={addParticipant}
            className="w-full p-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-md flex items-center justify-center"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף משתתף
          </button>
        </div>

        {/* Scene */}
        <div>
          <label htmlFor="scene-description" className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">הגדרת סצנה:</label>
          <div className="flex gap-2">
            <textarea
              id="scene-description"
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows="2"
              placeholder="תא שליטה של חללית. אזעקה נשמעת."
            />
            <button
              onClick={updateScene}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-md"
            >
              עדכן
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 flex flex-col-reverse">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <p>השיחה תתחיל כאן...</p>
            </div>
          )}
          
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            const isScene = message.sender === 'סצנה';
            const participantIndex = participants.findIndex(p => p.name === message.sender);
            const colorClass = isUser ? 'bg-teal-500 text-white' : 
                             isScene ? 'bg-purple-100 text-purple-800' :
                             participantColors[participantIndex % participantColors.length];
            const alignmentClass = isUser ? 'self-end' : 'self-start';

            return (
              <div
                key={message.id}
                className={`p-3 rounded-xl my-1 shadow-sm max-w-[85%] flex flex-col ${colorClass} ${alignmentClass}`}
              >
                {!isUser && !isScene && (
                  <div className="font-bold text-xs mb-1">{message.sender}</div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                </p>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="typing-indicator flex space-x-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  </div>
                  <span className="text-sm">מקליד...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <button
            onClick={startStopConversation}
            className={`w-full p-3 rounded-md font-bold text-white transition-colors duration-200 flex items-center justify-center ${
              isConversationActive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isConversationActive ? (
              <>
                <Square className="h-5 w-5 ml-2" />
                הפסק שיחה
              </>
            ) : (
              <>
                <Play className="h-5 w-5 ml-2" />
                התחל שיחה
              </>
            )}
          </button>
          
          {isConversationActive && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="chat-input" className="sr-only">הודעה</label>
                <input
                  id="chat-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="שלח הודעה כמשתמש..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                {voiceEnabled && (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className={`p-2 rounded-full ${
                      isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
                
                <button
                  onClick={sendUserMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {user?.quota?.messagesUsedToday || 0} / {user?.quota?.messagesLimitDaily || 20} הודעות נותרו
          {user?.plan === 'free' && user?.quota?.messagesUsedToday >= user?.quota?.messagesLimitDaily && (
            <div className="text-red-500 dark:text-red-400 font-semibold mt-1">
              הגעת לגבול ההודעות החינמיות
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;