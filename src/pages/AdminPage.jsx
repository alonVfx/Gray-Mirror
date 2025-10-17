import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Settings, Save, RefreshCw, Users, MessageSquare, 
  Palette, Globe, Crown, CheckCircle, AlertCircle,
  ArrowLeft, Lock, Unlock
} from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for all settings
  const [settings, setSettings] = useState({
    // Quota Settings
    quota: {
      freeMessagesDaily: 200,
      premiumMessagesDaily: 0, // 0 = unlimited
    },
    
    // Default Participants
    defaultParticipants: [
      { name: 'אליס', identity: 'מדענית חלל אופטימית' },
      { name: 'בוב', identity: 'אסטרונאוט ציני' }
    ],
    
    // Default Scene
    defaultScene: 'תא שליטה של חללית. אזעקה נשמעת.',
    
    // UI Settings
    ui: {
      primaryColor: 'blue',
      darkModeDefault: false,
      showWelcomeMessage: true,
      maxParticipants: 10,
      conversationSpeed: 5,
    },
    
    // Feature Flags
    features: {
      advancedChatEnabled: false,
      podcastsEnabled: false,
      voiceEnabled: false,
      historyEnabled: true,
      agentManagerEnabled: true,
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newParticipant, setNewParticipant] = useState({ name: '', identity: '' });

  // Check admin access
  useEffect(() => {
    if (!user || (user.email !== 'admin@graymirror.com' && user.email !== 'alonsaranga@gmail.com')) {
      navigate('/dashboard');
    } else {
      loadSettings();
    }
  }, [user, navigate]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת ההגדרות' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה!' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'שגיאה בשמירת ההגדרות' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const addParticipant = () => {
    if (newParticipant.name.trim() && newParticipant.identity.trim()) {
      setSettings(prev => ({
        ...prev,
        defaultParticipants: [...prev.defaultParticipants, newParticipant]
      }));
      setNewParticipant({ name: '', identity: '' });
    }
  };

  const removeParticipant = (index) => {
    setSettings(prev => ({
      ...prev,
      defaultParticipants: prev.defaultParticipants.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">פאנל ניהול - הגדרות מערכת</h1>
            </div>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>שומר...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>שמור הגדרות</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quota Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              הגדרות מכסות הודעות
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  מכסת הודעות יומית - Free Plan
                </label>
                <input
                  type="number"
                  value={settings.quota.freeMessagesDaily}
                  onChange={(e) => updateSetting('quota.freeMessagesDaily', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  הודעות ליום למשתמשים חינמיים
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  מכסת הודעות יומית - Premium Plan
                </label>
                <input
                  type="number"
                  value={settings.quota.premiumMessagesDaily}
                  onChange={(e) => updateSetting('quota.premiumMessagesDaily', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  0 = ללא הגבלה
                </p>
              </div>
            </div>
          </div>

          {/* Default Participants */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              דמויות ברירת מחדל
            </h2>
            
            <div className="space-y-3 mb-4">
              {settings.defaultParticipants.map((participant, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{participant.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{participant.identity}</div>
                  </div>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="שם הדמות"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                type="text"
                placeholder="זהות/תפקיד"
                value={newParticipant.identity}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, identity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={addParticipant}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + הוסף דמות
              </button>
            </div>
          </div>

          {/* Default Scene */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-600" />
              סצנת ברירת מחדל
            </h2>
            
            <textarea
              value={settings.defaultScene}
              onChange={(e) => updateSetting('defaultScene', e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="תאר את הסצנה הראשונית..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              הסצנה שתוצג כברירת מחדל בצ'אט חדש
            </p>
          </div>

          {/* UI Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              הגדרות ממשק
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  צבע ראשי
                </label>
                <select
                  value={settings.ui.primaryColor}
                  onChange={(e) => updateSetting('ui.primaryColor', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="blue">כחול</option>
                  <option value="purple">סגול</option>
                  <option value="green">ירוק</option>
                  <option value="red">אדום</option>
                  <option value="orange">כתום</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  מקסימום משתתפים בשיחה
                </label>
                <input
                  type="number"
                  value={settings.ui.maxParticipants}
                  onChange={(e) => updateSetting('ui.maxParticipants', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="2"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  מהירות שיחה ברירת מחדל (1-10)
                </label>
                <input
                  type="range"
                  value={settings.ui.conversationSpeed}
                  onChange={(e) => updateSetting('ui.conversationSpeed', parseInt(e.target.value))}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">{settings.ui.conversationSpeed}</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">מצב לילה כברירת מחדל</span>
                <button
                  onClick={() => updateSetting('ui.darkModeDefault', !settings.ui.darkModeDefault)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ui.darkModeDefault ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.ui.darkModeDefault ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">הצג הודעת ברוכים הבאים</span>
                <button
                  onClick={() => updateSetting('ui.showWelcomeMessage', !settings.ui.showWelcomeMessage)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ui.showWelcomeMessage ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.ui.showWelcomeMessage ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              הפעלת תכונות
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(settings.features).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {enabled ? (
                      <Unlock className="h-5 w-5 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {key === 'advancedChatEnabled' && 'צ\'אט מתקדם'}
                      {key === 'podcastsEnabled' && 'פודקאסטים'}
                      {key === 'voiceEnabled' && 'קול'}
                      {key === 'historyEnabled' && 'היסטוריה'}
                      {key === 'agentManagerEnabled' && 'ניהול סוכנים'}
                    </span>
                  </div>
                  <button
                    onClick={() => updateSetting(`features.${key}`, !enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPage;
