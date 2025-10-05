import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatComponent from '../components/ChatComponent';
import AgentManager from '../components/AgentManager';
import { LogOut, Settings, Users, MessageSquare, Crown } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600 ml-3" />
              <h1 className="text-xl font-bold text-gray-900">Gray Mirror</h1>
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
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Crown className={`h-5 w-5 ${user?.plan === 'premium' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {user?.plan === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {user?.quota?.messagesUsedToday || 0} / {user?.quota?.messagesLimitDaily || 20} הודעות
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900"
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
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                אנא אמת את כתובת המייל שלך. שלחנו לך אימייל אימות.
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
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>צ'אט</span>
              </button>
              
              <button
                onClick={() => setActiveTab('agents')}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'agents'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>ניהול סוכנים</span>
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
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
            {activeTab === 'agents' && <AgentManager />}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">הגדרות</h2>
                <p className="text-gray-600">הגדרות יגיעו בקרוב...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
