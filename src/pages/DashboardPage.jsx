import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ChatComponent from '../components/ChatComponent';
import AdvancedChatComponent from '../components/AdvancedChatComponent';
import PodcastPlatform from '../components/PodcastPlatform';
import SimpleTestComponent from '../components/SimpleTestComponent';
import AgentManager from '../components/AgentManager';
import ConversationHistory from '../components/ConversationHistory';
import { LogOut, Settings, Users, MessageSquare, Crown, Moon, Sun, History, Trash2, Headphones, Zap, TestTube, Info, Lock } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('about');
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    // Check if user needs to see upgrade notification
    if (user?.plan === 'free' && user?.quota?.messagesUsedToday >= user?.quota?.messagesLimitDaily * 0.8) {
      setShowUpgrade(true);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const resetQuota = () => {
    // This would typically be handled by a Cloud Function
    // For now, we'll just hide the notification
    setShowUpgrade(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400 ml-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gray Mirror</h1>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Admin Access Button */}
              {(user?.email === 'admin@graymirror.com' || user?.email === 'alonsaranga@gmail.com') && (
                <a
                  href="/admin"
                  className="flex items-center space-x-2 space-x-reverse px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">מנהל</span>
                </a>
              )}
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={isDarkMode ? 'מעבר למצב יום' : 'מעבר למצב לילה'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Crown className={`h-5 w-5 ${user?.plan === 'premium' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.plan === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {user?.quota?.messagesUsedToday || 0} / {user?.quota?.messagesLimitDaily || 200} הודעות
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span>יציאה</span>
              </button>
            </div>
          </div>
        </div>
      </header>


      {/* Upgrade Notification */}
      {showUpgrade && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  אתה מתקרב לגבול ההודעות החינמיות. שדרג ל-Premium לקבלת הודעות בלתי מוגבלות!
                </p>
              </div>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={resetQuota}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                סגור
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                שדרג עכשיו
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
                      <button
                        onClick={() => setActiveTab('about')}
                        className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                          activeTab === 'about'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Info className="h-5 w-5" />
                        <span>אודות המערכת</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                          activeTab === 'chat'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span>צ'אט בסיסי</span>
                      </button>

                      <button
                        disabled
                        className="w-full flex items-center justify-between space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Zap className="h-5 w-5" />
                          <span>צ'אט מתקדם</span>
                        </div>
                        <Lock className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-3">נפתח בקרוב</span>

                      <button
                        disabled
                        className="w-full flex items-center justify-between space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Headphones className="h-5 w-5" />
                          <span>פודקאסטים AI</span>
                        </div>
                        <Lock className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-3">נפתח בקרוב</span>

                      <button
                        onClick={() => setActiveTab('test')}
                        className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                          activeTab === 'test'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <TestTube className="h-5 w-5" />
                        <span>בדיקת AI</span>
                      </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'history'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <History className="h-5 w-5" />
                <span>היסטוריית שיחות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('agents')}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'agents'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>ניהול סוכנים</span>
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>הגדרות</span>
              </button>
            </nav>
          </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    {activeTab === 'about' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                        <div className="max-w-4xl mx-auto">
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            ברוכים הבאים ל-Gray Mirror
                          </h1>
                          
                          <div className="prose dark:prose-invert max-w-none space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-6 rounded-lg">
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                🤖 מהי המערכת?
                              </h2>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                Gray Mirror היא פלטפורמה מתקדמת ליצירת שיחות חכמות מבוססות AI. 
                                המערכת מאפשרת לך ליצור שיחות אינטראקטיביות עם דמויות וירטואליות שונות,
                                להעביר דיונים מורכבים, ולבנות סימולציות שיחה ריאליסטיות.
                              </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                  <Zap className="h-5 w-5 text-green-600" />
                                  יתרונות המערכת
                                </h3>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>תמיכה ב-3 ספקי AI מובילים (OpenAI, Together AI, Gemini)</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>יצירת שיחות רב-משתתפים דינמיות</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>ניהול סוכנים עם אישיות וזהות ייחודית</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>שמירת היסטוריית שיחות ב-Cloud</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>תגובות מהירות ואיכותיות בעברית</span>
                                  </li>
                                </ul>
                              </div>

                              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                  <Settings className="h-5 w-5 text-purple-600" />
                                  איך זה עובד?
                                </h3>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                  <li className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">1.</span>
                                    <span>בחר את סוג הצ'אט (בסיסי/מתקדם)</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">2.</span>
                                    <span>הוסף משתתפים והגדר זהויות</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">3.</span>
                                    <span>קבע סצנה או הקשר לשיחה</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">4.</span>
                                    <span>בחר ספק AI מועדף</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">5.</span>
                                    <span>התחל שיחה והמערכת תייצר תשובות חכמות</span>
                                  </li>
                                </ul>
                              </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <Crown className="h-5 w-5 text-orange-600" />
                                תכונות מתקדמות
                              </h3>
                              <div className="grid md:grid-cols-3 gap-4 text-gray-700 dark:text-gray-300">
                                <div>
                                  <strong className="text-gray-900 dark:text-gray-100">אבטחה מלאה</strong>
                                  <p className="text-sm mt-1">כל הקריאות עוברות דרך Firebase Functions המאובטחות</p>
                                </div>
                                <div>
                                  <strong className="text-gray-900 dark:text-gray-100">ניהול מכסות</strong>
                                  <p className="text-sm mt-1">מעקב אחר שימוש והגבלות לפי תוכנית</p>
                                </div>
                                <div>
                                  <strong className="text-gray-900 dark:text-gray-100">גיבוי אוטומטי</strong>
                                  <p className="text-sm mt-1">כל השיחות נשמרות ב-Firestore</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                              <h3 className="text-xl font-bold mb-3">מוכנים להתחיל?</h3>
                              <p className="mb-4">
                                בחרו "צ'אט בסיסי" מהתפריט כדי ליצור את השיחה הראשונה שלכם, 
                                או "בדיקת AI" כדי לבדוק שהמערכת פועלת כראוי.
                              </p>
                              <button
                                onClick={() => setActiveTab('chat')}
                                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                              >
                                התחל עכשיו →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'chat' && <ChatComponent />}
                    {activeTab === 'advanced' && <AdvancedChatComponent />}
                    {activeTab === 'podcasts' && <PodcastPlatform />}
                    {activeTab === 'test' && <SimpleTestComponent />}
                    {activeTab === 'history' && <ConversationHistory />}
                    {activeTab === 'agents' && <AgentManager />}
                    {activeTab === 'settings' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">הגדרות</h2>
                        <p className="text-gray-600 dark:text-gray-300">הגדרות יגיעו בקרוב...</p>
                      </div>
                    )}
                  </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
