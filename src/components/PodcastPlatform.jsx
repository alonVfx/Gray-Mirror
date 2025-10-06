import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { aiManager, AI_PROVIDERS } from '../config/aiProviders';
import { 
  Play, Pause, Square, Volume2, VolumeX, Download, Share2, Heart, 
  Clock, Users, Star, Search, Filter, Mic, MicOff, Headphones,
  BookOpen, Microscope, Brain, Heart as HeartIcon, Briefcase,
  Music, Gamepad2, Camera, Globe, Zap, Crown, TrendingUp,
  ChevronLeft, ChevronRight, Plus, Edit, Trash2, Eye, EyeOff, X
} from 'lucide-react';

const PodcastPlatform = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Core states
  const [podcasts, setPodcasts] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  // Podcast creation states
  const [newPodcast, setNewPodcast] = useState({
    title: '',
    description: '',
    category: '',
    duration: 15,
    language: 'he',
    hostPersonality: 'friendly',
    topic: '',
    isPublic: true
  });

  // Podcast categories
  const categories = [
    { id: 'all', name: 'הכל', icon: <Globe className="h-5 w-5" />, color: 'bg-gray-500' },
    { id: 'history', name: 'היסטוריה', icon: <BookOpen className="h-5 w-5" />, color: 'bg-amber-500' },
    { id: 'science', name: 'מדע', icon: <Microscope className="h-5 w-5" />, color: 'bg-blue-500' },
    { id: 'mindfulness', name: 'מיינדפולנס', icon: <Brain className="h-5 w-5" />, color: 'bg-purple-500' },
    { id: 'personal', name: 'אישי', icon: <HeartIcon className="h-5 w-5" />, color: 'bg-pink-500' },
    { id: 'business', name: 'עסקים', icon: <Briefcase className="h-5 w-5" />, color: 'bg-green-500' },
    { id: 'technology', name: 'טכנולוגיה', icon: <Zap className="h-5 w-5" />, color: 'bg-indigo-500' },
    { id: 'entertainment', name: 'בידור', icon: <Music className="h-5 w-5" />, color: 'bg-yellow-500' },
    { id: 'gaming', name: 'גיימינג', icon: <Gamepad2 className="h-5 w-5" />, color: 'bg-red-500' },
    { id: 'art', name: 'אמנות', icon: <Camera className="h-5 w-5" />, color: 'bg-teal-500' }
  ];

  // Host personalities
  const personalities = [
    { id: 'friendly', name: 'ידידותי', description: 'חם ומזמין, כמו חבר טוב' },
    { id: 'professional', name: 'מקצועי', description: 'פורמלי ומדויק' },
    { id: 'humorous', name: 'הומוריסטי', description: 'מצחיק ומשעשע' },
    { id: 'academic', name: 'אקדמי', description: 'מעמיק ומחקרי' },
    { id: 'calm', name: 'רגוע', description: 'שליו ומרגיע' },
    { id: 'energetic', name: 'אנרגטי', description: 'דינמי ומלהיב' }
  ];

  // Sample podcasts data
  const samplePodcasts = [
    {
      id: 1,
      title: 'ההיסטוריה של החלל',
      description: 'מסע מרתק דרך ההיסטוריה של חקר החלל',
      category: 'history',
      duration: 20,
      language: 'he',
      hostPersonality: 'academic',
      isPublic: true,
      likes: 1247,
      plays: 8934,
      createdAt: new Date('2024-01-15'),
      audioUrl: null,
      transcript: ''
    },
    {
      id: 2,
      title: 'מדעי המוח והמודעות',
      description: 'הבנת המוח האנושי והמודעות העצמית',
      category: 'science',
      duration: 25,
      language: 'he',
      hostPersonality: 'professional',
      isPublic: true,
      likes: 892,
      plays: 5672,
      createdAt: new Date('2024-01-14'),
      audioUrl: null,
      transcript: ''
    },
    {
      id: 3,
      title: 'מיינדפולנס לחיי היומיום',
      description: 'טכניקות פשוטות למיינדפולנס בחיי היומיום',
      category: 'mindfulness',
      duration: 18,
      language: 'he',
      hostPersonality: 'calm',
      isPublic: true,
      likes: 2156,
      plays: 12345,
      createdAt: new Date('2024-01-13'),
      audioUrl: null,
      transcript: ''
    }
  ];

  useEffect(() => {
    setPodcasts(samplePodcasts);
  }, []);

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = podcast.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         podcast.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || podcast.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const generatePodcast = async () => {
    if (!newPodcast.title || !newPodcast.topic) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setIsGenerating(true);
    
    try {
      const category = categories.find(c => c.id === newPodcast.category);
      const personality = personalities.find(p => p.id === newPodcast.hostPersonality);
      
      const prompt = `Create a ${newPodcast.duration}-minute podcast episode about "${newPodcast.topic}" in Hebrew.
      Category: ${category?.name || 'General'}
      Host personality: ${personality?.name || 'Friendly'}
      Style: ${personality?.description || 'Engaging and informative'}
      
      Make it engaging, informative, and natural. Include:
      - Introduction
      - Main content with examples
      - Conclusion
      - Call to action
      
      Format as a natural conversation that sounds like a real podcast.`;

      const response = await aiManager.generateResponse(prompt, {
        agents: [],
        conversationHistory: []
      });

      const newPodcastData = {
        id: Date.now(),
        title: newPodcast.title,
        description: newPodcast.description,
        category: newPodcast.category,
        duration: newPodcast.duration,
        language: newPodcast.language,
        hostPersonality: newPodcast.hostPersonality,
        isPublic: newPodcast.isPublic,
        likes: 0,
        plays: 0,
        createdAt: new Date(),
        audioUrl: null,
        transcript: response
      };

      setPodcasts(prev => [newPodcastData, ...prev]);
      setShowCreateForm(false);
      
      // Reset form
      setNewPodcast({
        title: '',
        description: '',
        category: '',
        duration: 15,
        language: 'he',
        hostPersonality: 'friendly',
        topic: '',
        isPublic: true
      });

    } catch (error) {
      console.error('Error generating podcast:', error);
      alert('שגיאה ביצירת הפודקאסט: ' + error.message);
    }
    
    setIsGenerating(false);
  };

  const playPodcast = (podcast) => {
    setCurrentEpisode(podcast);
    setIsPlaying(true);
    
    // In a real app, you would generate audio from the transcript
    // For now, we'll just simulate playing
    console.log('Playing podcast:', podcast.title);
  };

  const formatDuration = (minutes) => {
    return `${minutes} דקות`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('he-IL');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[85vh] min-h-[700px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Headphones className="h-8 w-8 ml-3 text-blue-600" />
              פודקאסטים AI
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              פלטפורמת פודקאסטים חכמה עם תוכן איכותי
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 ml-2" />
            צור פודקאסט
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="חפש פודקאסטים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? `${category.color} text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podcast Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPodcasts.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Headphones className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">לא נמצאו פודקאסטים</p>
            <p className="text-sm">נסה לשנות את החיפוש או הקטגוריה</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPodcasts.map(podcast => {
              const category = categories.find(c => c.id === podcast.category);
              return (
                <div
                  key={podcast.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => playPodcast(podcast)}
                >
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center space-x-2 space-x-reverse px-2 py-1 rounded-full text-xs font-medium text-white ${category?.color || 'bg-gray-500'}`}>
                      {category?.icon}
                      <span>{category?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(podcast.duration)}</span>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                    {podcast.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Play className="h-3 w-3" />
                        <span>{podcast.plays.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Heart className="h-3 w-3" />
                        <span>{podcast.likes.toLocaleString()}</span>
                      </div>
                    </div>
                    <span>{formatDate(podcast.createdAt)}</span>
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playPodcast(podcast);
                    }}
                    className="w-full flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="h-4 w-4 ml-2" />
                    השמע
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Podcast Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                צור פודקאסט חדש
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  כותרת הפודקאסט
                </label>
                <input
                  type="text"
                  value={newPodcast.title}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="לדוגמה: ההיסטוריה של החלל"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  תיאור
                </label>
                <textarea
                  value={newPodcast.description}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows="3"
                  placeholder="תיאור קצר של הפודקאסט"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  נושא הפודקאסט
                </label>
                <input
                  type="text"
                  value={newPodcast.topic}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="לדוגמה: חקר החלל, מדעי המוח, מיינדפולנס"
                />
              </div>

              {/* Category and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    קטגוריה
                  </label>
                  <select
                    value={newPodcast.category}
                    onChange={(e) => setNewPodcast(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">בחר קטגוריה</option>
                    {categories.slice(1).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    משך (דקות)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={newPodcast.duration}
                    onChange={(e) => setNewPodcast(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Host Personality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  אישיות המנחה
                </label>
                <select
                  value={newPodcast.hostPersonality}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, hostPersonality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {personalities.map(personality => (
                    <option key={personality.id} value={personality.id}>
                      {personality.name} - {personality.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Public/Private */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newPodcast.isPublic}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  פודקאסט ציבורי (זמין לכולם)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ביטול
              </button>
              <button
                onClick={generatePodcast}
                disabled={isGenerating}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    יוצר פודקאסט...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 ml-2" />
                    צור פודקאסט
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Now Playing */}
      {currentEpisode && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {currentEpisode.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentEpisode.description}
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Download className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastPlatform;
