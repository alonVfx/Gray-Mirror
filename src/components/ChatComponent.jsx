import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions, analytics, logEvent } from '../firebase/config';
import { Send, Mic, MicOff, Volume2, VolumeX, Users, Plus, X, Play, Square } from 'lucide-react';

const ChatComponent = () => {
  const { user } = useAuth();
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
  const messagesEndRef = useRef(null);
  const conversationTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const participantColors = [
    'bg-blue-200 text-blue-900', 'bg-red-200 text-red-900', 'bg-green-200 text-green-900', 
    'bg-yellow-200 text-yellow-900', 'bg-purple-200 text-purple-900', 'bg-pink-200 text-pink-900',
    'bg-indigo-200 text-indigo-900', 'bg-teal-200 text-teal-900', 'bg-orange-200 text-orange-900'
  ];

  const callGeminiAPI = async (prompt) => {
    try {
      const callGemini = httpsCallable(functions, 'callGemini');
      
      const result = await callGemini({
        prompt: prompt,
        agents: participants,
        conversationHistory: messages.slice(-10).map(msg => ({ sender: msg.sender, text: msg.text }))
      });
      
      return result.data.response;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
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

    setIsTyping(true);
    setIsLoading(true);

    try {
      const prompt = createDirectorPrompt();
      const response = await callGeminiAPI(prompt);

      if (response) {
        const parts = response.split(':');
        if (parts.length >= 2) {
          const speaker = parts[0].trim();
          const message = parts.slice(1).join(':').trim();
          
          if (participants.some(p => p.name === speaker)) {
            const newMessage = {
              id: Date.now(),
              text: message,
              sender: speaker,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMessage]);
          }
        }
      }
    } catch (error) {
      console.error('Error generating next turn:', error);
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        text: 'שגיאה ביצירת תגובה. אנא נסה שוב.',
        sender: 'מערכת',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
    setIsLoading(false);
    
    if (isConversationActive) {
      conversationTimeoutRef.current = setTimeout(generateNextTurn, Math.random() * 2000 + 2000);
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

  const startStopConversation = () => {
    if (isConversationActive) {
      // Stop conversation
      setIsConversationActive(false);
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      setIsTyping(false);
      setIsLoading(false);
      
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
      
      setIsConversationActive(true);
      setMessages([]);
      
      const sceneMessage = {
        id: Date.now(),
        text: scene.trim() || 'השיחה מתחילה ללא סצנה מוגדרת.',
        sender: 'סצנה',
        timestamp: new Date().toISOString()
      };
      setMessages([sceneMessage]);
      
      // Track conversation start
      if (analytics) {
        logEvent(analytics, 'conversation_started', {
          participants_count: participants.length,
          scene_length: scene.trim().length,
          user_plan: user?.plan || 'unknown'
        });
      }
      
      setTimeout(generateNextTurn, 1000);
    }
  };

  const sendUserMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    // Check quota for free users
    if (user?.plan === 'free' && user?.quota?.messagesUsedToday >= user?.quota?.messagesLimitDaily) {
      alert('הגעת לגבול ההודעות החינמיות. שדרג ל-Premium להמשך השימוש.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      await generateNextTurn();
    } catch (error) {
      console.error('Error sending user message:', error);
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        text: 'שגיאה בשליחת הודעה. אנא נסה שוב.',
        sender: 'מערכת',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
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
    <div className="bg-white rounded-lg shadow h-[700px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">סימולטור צ'אט קבוצתי</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full ${
                voiceEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        {/* Participants Management */}
        <div className="bg-gray-50 rounded-lg p-3 border">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
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
            <input
              type="text"
              value={newParticipant.name}
              onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
              className="flex-1 p-2 border rounded-md text-sm"
              placeholder="שם"
            />
            <input
              type="text"
              value={newParticipant.identity}
              onChange={(e) => setNewParticipant(prev => ({ ...prev, identity: e.target.value }))}
              className="flex-1 p-2 border rounded-md text-sm"
              placeholder="זהות"
            />
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
          <label className="block text-gray-700 font-semibold mb-1">הגדרת סצנה:</label>
          <div className="flex gap-2">
            <textarea
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col-reverse">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
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
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="שלח הודעה כמשתמש..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        
        <div className="text-xs text-gray-500 text-center">
          {user?.quota?.messagesUsedToday || 0} / {user?.quota?.messagesLimitDaily || 20} הודעות נותרו
          {user?.plan === 'free' && user?.quota?.messagesUsedToday >= user?.quota?.messagesLimitDaily && (
            <div className="text-red-500 font-semibold mt-1">
              הגעת לגבול ההודעות החינמיות
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;