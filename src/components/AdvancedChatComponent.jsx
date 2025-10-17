import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Users, Plus, X, Play, Square, 
  Brain, History, RefreshCw, Globe, Settings, Zap, Target, Palette,
  ChevronDown, ChevronUp, Star, Crown, Briefcase, GraduationCap,
  Heart, Music, Gamepad2, BookOpen, Microscope, Camera
} from 'lucide-react';

const AdvancedChatComponent = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Core states
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAIProvider, setCurrentAIProvider] = useState('together');
  const [conversationSpeed, setConversationSpeed] = useState(5);
  const [customDelay, setCustomDelay] = useState(5000);
  const [isPaused, setIsPaused] = useState(false);

  // Advanced configuration states
  const [selectedTopic, setSelectedTopic] = useState('');
  const [participantCount, setParticipantCount] = useState(3);
  const [selectedLanguage, setSelectedLanguage] = useState('he');
  const [selectedVoices, setSelectedVoices] = useState([]);
  const [selectedPersonalities, setSelectedPersonalities] = useState([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [scene, setScene] = useState('תא שליטה של חללית. אזעקה נשמעת.');

  const messagesEndRef = useRef(null);
  const conversationTimeoutRef = useRef(null);

  // Topic options
  const topicOptions = [
    { id: 'space', name: '🚀 חלל ומדע', description: 'מסעות בין כוכבים, מחקר מדעי' },
    { id: 'business', name: '💼 עסקים וטכנולוגיה', description: 'סטארטאפים, חדשנות טכנולוגית' },
    { id: 'education', name: '🎓 חינוך ולימוד', description: 'הוראה, מחקר אקדמי' },
    { id: 'health', name: '🏥 בריאות ורפואה', description: 'רפואה מודרנית, טיפולים' },
    { id: 'art', name: '🎨 אמנות ותרבות', description: 'יצירה, מוזיקה, ספרות' },
    { id: 'sports', name: '⚽ ספורט וכושר', description: 'אימונים, תחרויות' },
    { id: 'travel', name: '✈️ טיולים ותיירות', description: 'מסעות, תרבויות' },
    { id: 'food', name: '🍽️ בישול וקולינריה', description: 'מתכונים, מסעדות' },
    { id: 'gaming', name: '🎮 משחקים ובידור', description: 'גיימינג, סרטים' },
    { id: 'nature', name: '🌿 טבע וסביבה', description: 'אקולוגיה, בעלי חיים' }
  ];

  // Language options
  const languageOptions = [
    { id: 'he', name: 'עברית', flag: '🇮🇱' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'ar', name: 'العربية', flag: '🇸🇦' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'it', name: 'Italiano', flag: '🇮🇹' },
    { id: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  // Voice/Personality types
  const personalityTypes = [
    { id: 'professional', name: 'מקצועי', icon: <Briefcase className="h-4 w-4" />, description: 'סגנון עסקי ופורמלי' },
    { id: 'academic', name: 'אקדמי', icon: <GraduationCap className="h-4 w-4" />, description: 'מחקר וניתוח מעמיק' },
    { id: 'friendly', name: 'ידידותי', icon: <Heart className="h-4 w-4" />, description: 'חם ומזמין' },
    { id: 'artistic', name: 'אמנותי', icon: <Palette className="h-4 w-4" />, description: 'יצירתי וחדשני' },
    { id: 'technical', name: 'טכני', icon: <Settings className="h-4 w-4" />, description: 'מדויק ומפורט' },
    { id: 'humorous', name: 'הומוריסטי', icon: <Zap className="h-4 w-4" />, description: 'מצחיק ומשעשע' },
    { id: 'scientific', name: 'מדעי', icon: <Microscope className="h-4 w-4" />, description: 'מבוסס עובדות' },
    { id: 'creative', name: 'יצירתי', icon: <Camera className="h-4 w-4" />, description: 'דמיוני וחדשני' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate participants based on selections
  const generateParticipants = () => {
    const participants = [];
    const topic = topicOptions.find(t => t.id === selectedTopic);
    const language = languageOptions.find(l => l.id === selectedLanguage);
    
    for (let i = 0; i < participantCount; i++) {
      const personality = selectedPersonalities[i] || personalityTypes[i % personalityTypes.length];
      const name = generateParticipantName(i, language.id);
      
      participants.push({
        name: name,
        identity: `${personality.name} ${topic ? topic.name.replace(/🚀|💼|🎓|🏥|🎨|⚽|✈️|🍽️|🎮|🌿/g, '') : 'משתתף'}`,
        personality: personality.id,
        voice: selectedVoices[i] || 'default'
      });
    }
    
    return participants;
  };

  const generateParticipantName = (index, language) => {
    const names = {
      he: ['אליס', 'בוב', 'דוד', 'שרה', 'מיכאל', 'רחל', 'יוסי', 'מירי'],
      en: ['Alice', 'Bob', 'David', 'Sarah', 'Michael', 'Rachel', 'Joseph', 'Miriam'],
      ar: ['علي', 'فاطمة', 'محمد', 'أسماء', 'أحمد', 'زينب', 'عمر', 'خديجة'],
      es: ['Alejandro', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Isabel'],
      fr: ['Pierre', 'Marie', 'Jean', 'Sophie', 'Paul', 'Claire', 'Marc', 'Julie'],
      de: ['Hans', 'Anna', 'Klaus', 'Greta', 'Wolfgang', 'Ingrid', 'Helmut', 'Ursula'],
      it: ['Marco', 'Giulia', 'Alessandro', 'Francesca', 'Luca', 'Chiara', 'Andrea', 'Elena'],
      ru: ['Алексей', 'Мария', 'Дмитрий', 'Анна', 'Владимир', 'Елена', 'Сергей', 'Ольга']
    };
    
    return names[language]?.[index] || `Participant ${index + 1}`;
  };

  const startConversation = async () => {
    if (!selectedTopic) {
      alert('אנא בחר נושא לשיחה');
      return;
    }

    setIsLoading(true);
    setIsConversationActive(true);
    
    const participants = generateParticipants();
    const topic = topicOptions.find(t => t.id === selectedTopic);
    const language = languageOptions.find(l => l.id === selectedLanguage);
    
    // Add initial scene message
    const sceneMessage = {
      text: `${topic.name} - ${language.name}`,
      sender: 'סצנה',
      type: 'scene',
      timestamp: new Date()
    };
    
    setMessages([sceneMessage]);
    
    // Start the conversation
    setTimeout(() => {
      generateNextTurn();
    }, 2000);
    
    setIsLoading(false);
  };

  const generateNextTurn = async () => {
    if (!isConversationActive || isTyping || isPaused) return;

    console.log('Generating next turn with AI provider:', currentAIProvider);
    setIsTyping(true);
    setIsLoading(true);

    try {
      const participants = generateParticipants();
      const topic = topicOptions.find(t => t.id === selectedTopic);
      const language = languageOptions.find(l => l.id === selectedLanguage);
      
      const prompt = `Create a natural conversation about ${topic.name} in ${language.name}. 
      Participants: ${participants.map(p => `${p.name} (${p.personality})`).join(', ')}.
      Make it engaging and realistic. Respond in ${language.name}.`;

      // Call Firebase Function with selected AI provider
      const callAI = httpsCallable(functions, 'callAI');
      const result = await callAI({
        prompt: prompt,
        agents: participants,
        conversationHistory: messages.slice(-10).map(msg => ({
          sender: msg.sender,
          text: msg.text
        })),
        provider: currentAIProvider // Use the selected provider
      });
      
      const response = result.data?.response;

      if (response && typeof response === 'string') {
        const parts = response.split(':');
        if (parts.length >= 2) {
          const speaker = parts[0].trim();
          const message = parts.slice(1).join(':').trim();

          const participant = participants.find(p => p.name === speaker);
          if (participant) {
            const newMessage = {
              text: message,
              sender: speaker,
              type: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
          }
        }
      }
    } catch (error) {
      console.error('Error generating next turn:', error);
      const errorMessage = {
        text: `שגיאה ביצירת תגובה: ${error.message}`,
        sender: 'מערכת',
        type: 'error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
    setIsLoading(false);

    if (isConversationActive) {
      const baseDelay = customDelay;
      const randomVariation = baseDelay * 0.3;
      const finalDelay = baseDelay + (Math.random() * randomVariation * 2 - randomVariation);
      
      conversationTimeoutRef.current = setTimeout(generateNextTurn, finalDelay);
    }
  };

  const stopConversation = () => {
    setIsConversationActive(false);
    setIsTyping(false);
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }
  };

  const updateScene = () => {
    if (scene.trim()) {
      const sceneMessage = {
        text: scene,
        sender: 'סצנה',
        type: 'scene',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, sceneMessage]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[85vh] min-h-[700px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            🚀 פלטפורמת שיחה מתקדמת
          </h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* AI Provider */}
            <select
              value={currentAIProvider}
              onChange={(e) => setCurrentAIProvider(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="openai">🤖 OpenAI</option>
              <option value="together">🚀 Together AI</option>
              <option value="gemini">🧠 Gemini</option>
            </select>

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className={`p-2 rounded-full ${
                showAdvancedSettings
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="הגדרות מתקדמות"
            >
              {showAdvancedSettings ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings Panel */}
      {showAdvancedSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🎭 נושא השיחה
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">בחר נושא...</option>
                {topicOptions.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              {selectedTopic && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {topicOptions.find(t => t.id === selectedTopic)?.description}
                </p>
              )}
            </div>

            {/* Participant Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                👥 כמות משתתפים
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={participantCount}
                onChange={(e) => setParticipantCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {participantCount} משתתפים
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🌍 שפה
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {languageOptions.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ⏱️ מהירות שיחה
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={Math.round(customDelay / 500)}
                onChange={(e) => {
                  const multiplier = parseInt(e.target.value);
                  const newDelay = multiplier * 500;
                  setCustomDelay(newDelay);
                }}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {(customDelay / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Personality Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🎭 אישיות משתתפים
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {personalityTypes.map((personality, index) => (
                <button
                  key={personality.id}
                  onClick={() => {
                    const newPersonalities = [...selectedPersonalities];
                    newPersonalities[index] = personality;
                    setSelectedPersonalities(newPersonalities);
                  }}
                  className={`p-2 rounded-lg border text-sm flex items-center space-x-2 space-x-reverse ${
                    selectedPersonalities[index]?.id === personality.id
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {personality.icon}
                  <span>{personality.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        {/* Scene Configuration */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">הגדרת סצנה:</h3>
          <div className="flex gap-2">
            <textarea
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows="2"
              placeholder="תא שליטה של חללית. אזעקה נשמעת."
            />
            <button
              onClick={updateScene}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-md whitespace-nowrap"
            >
              עדכן
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 flex flex-col-reverse">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>בחר נושא והתחל שיחה מתקדמת</p>
              <p className="text-sm">המערכת תיצור משתתפים אוטומטית בהתאם לבחירות שלך</p>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.sender === 'user';
            const isScene = message.sender === 'סצנה';
            const participantColors = [
              'bg-blue-200 text-blue-900', 'bg-red-200 text-red-900', 'bg-green-200 text-green-900',
              'bg-yellow-200 text-yellow-900', 'bg-purple-200 text-purple-900', 'bg-pink-200 text-pink-900',
              'bg-indigo-200 text-indigo-900', 'bg-teal-200 text-teal-900'
            ];

            const messageColorClass = isUser
              ? 'bg-blue-500 text-white self-end rounded-br-none'
              : isScene
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 self-center text-center rounded-md'
              : `${participantColors[index % participantColors.length]} rounded-bl-none`;

            return (
              <div
                key={index}
                className={`max-w-[70%] p-3 rounded-lg mb-2 ${
                  isUser ? 'self-end' : 'self-start'
                } ${messageColorClass}`}
              >
                {!isUser && !isScene && (
                  <div className="font-bold text-xs mb-1">
                    {message.sender}
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
                <div className="text-xs opacity-75 mt-1 text-left">
                  {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          }).reverse()}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isConversationActive ? (
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <button
              onClick={startConversation}
              disabled={!selectedTopic || isLoading}
              className="flex items-center justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  מתחיל שיחה...
                </div>
              ) : (
                <>
                  <Play className="h-5 w-5 ml-2" />
                  התחל שיחה מתקדמת
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-md flex items-center ${
                isPaused
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isPaused ? <Play className="h-4 w-4 ml-2" /> : <Square className="h-4 w-4 ml-2" />}
              {isPaused ? 'המשך' : 'השהה'}
            </button>
            
            <button
              onClick={stopConversation}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center"
            >
              <Square className="h-4 w-4 ml-2" />
              עצור שיחה
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedChatComponent;
