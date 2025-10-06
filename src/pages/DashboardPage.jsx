import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ChatComponent from '../components/ChatComponent';
import AgentManager from '../components/AgentManager';
import ConversationHistory from '../components/ConversationHistory';
import { LogOut, Settings, Users, MessageSquare, Crown, Moon, Sun, History, Trash2 } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('chat');
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
                {user?.quota?.messagesUsedToday || 0} / {user?.quota?.messagesLimitDaily || 20} הודעות
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

      {/* Email Verification Alert */}
      {user && !user.emailVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>אימות אימייל נדרש:</strong> שלחנו אימייל אימות לכתובת {user.email}. 
                אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות. 
                אם לא רואה את האימייל, בדוק גם בתיקיית הספאם.
              </p>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'chat'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>צ'אט</span>
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
            {activeTab === 'chat' && <ChatComponent />}
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
