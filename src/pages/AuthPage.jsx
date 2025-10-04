import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Mail, Lock, User, MessageSquare, Sparkles, Users, Zap, ArrowRight, Shield, Brain } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
        setError('נשלח אימייל אימות. אנא בדוק את תיבת הדואר שלך.');
      }
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="text-center lg:text-right space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-end space-x-3 space-x-reverse">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gray Mirror
                </h1>
              </div>
              <p className="text-xl text-gray-600 font-medium">
                מערכת צ'אט רב-סוכנים חכמה
              </p>
              <p className="text-lg text-gray-500">
                צרו שיחות מרתקות בין בוטים AI עם אישיות ייחודית
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-end space-x-3 space-x-reverse">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">ניהול סוכנים מרובים</span>
              </div>
              <div className="flex items-center justify-center lg:justify-end space-x-3 space-x-reverse">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-gray-700">AI מתקדם עם Gemini</span>
              </div>
              <div className="flex items-center justify-center lg:justify-end space-x-3 space-x-reverse">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-gray-700">שיחות בזמן אמת</span>
              </div>
              <div className="flex items-center justify-center lg:justify-end space-x-3 space-x-reverse">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-gray-700">אבטחה מתקדמת</span>
              </div>
            </div>

            {/* Demo Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">דוגמה לשיחה:</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-blue-100 text-blue-800 p-2 rounded-lg text-right">
                  <strong>אליס:</strong> אני חושבת שמצאנו משהו מעניין כאן...
                </div>
                <div className="bg-red-100 text-red-800 p-2 rounded-lg text-right">
                  <strong>בוב:</strong> אתה בטוח? זה נראה מסוכן מדי.
                </div>
                <div className="bg-green-100 text-green-800 p-2 rounded-lg text-right">
                  <strong>ד"ר סמית:</strong> בואו נבדוק את הנתונים יחד.
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'ברוכים הבאים חזרה!' : 'הצטרפו לקהילה'}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? 'התחברו לחשבון שלכם והתחילו ליצור' 
                  : 'צרו חשבון חדש והתחילו את המסע שלכם'
                }
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 ml-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  כתובת אימייל
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="הכנס כתובת אימייל"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  סיסמה
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="הכנס סיסמה"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    {isLogin ? 'מתחבר...' : 'יוצר חשבון...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isLogin ? 'התחבר' : 'צור חשבון'}
                    <ArrowRight className="h-5 w-5 mr-2" />
                  </div>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  {isLogin ? 'הירשם כאן' : 'התחבר כאן'}
                </button>
              </p>
            </div>

            {/* Free Plan Info */}
            <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  תוכנית חינמית: 20 הודעות ביום
                </span>
              </div>
              <p className="text-xs text-green-700 text-center mt-1">
                ללא עלות • ללא התחייבות • התחל עכשיו
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;