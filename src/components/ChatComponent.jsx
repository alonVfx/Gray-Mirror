import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const ChatComponent = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

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
      // Call the real Gemini API through Cloud Functions
      const response = await callGeminiAPI(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update quota
      // This would typically be handled by a Cloud Function
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'מצטער, אירעה שגיאה. אנא נסה שוב.',
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const callGeminiAPI = async (message) => {
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const callGemini = httpsCallable(functions, 'callGemini');
      
      const result = await callGemini({
        prompt: message,
        agents: [], // You can pass agent context here later
        conversationHistory: messages.slice(-10).map(msg => ({ sender: msg.sender, text: msg.text }))
      });
      
      return result.data.response;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">צ'אט AI</h2>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>שלום! איך אני יכול לעזור לך היום?</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.sender === 'system'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString('he-IL')}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="typing-indicator flex space-x-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                </div>
                <span className="text-sm">מקליד...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2 space-x-reverse">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="הקלד הודעה..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
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
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {user?.quota?.messagesUsedToday || 0} / {user?.quota?.messagesLimitDaily || 20} הודעות נותרו
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
