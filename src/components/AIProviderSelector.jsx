import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AI_PROVIDERS, aiManager } from '../config/aiProviders';
import { Settings, Zap, Brain, Rocket, Check, AlertCircle } from 'lucide-react';

const AIProviderSelector = ({ onProviderChange, currentProvider }) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('');

  const handleProviderSelect = async (providerId) => {
    try {
      setStatus('מעבר לספק AI...');
      const success = aiManager.setProvider(providerId);
      
      if (success) {
        setStatus('הספק עודכן בהצלחה');
        onProviderChange(providerId);
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('שגיאה בעדכון הספק');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      setStatus('שגיאה בחיבור לספק AI');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const getProviderIcon = (providerId) => {
    switch (providerId) {
      case 'openai':
        return <Brain className="h-4 w-4" />;
      case 'together':
        return <Rocket className="h-4 w-4" />;
      case 'gemini':
        return <Zap className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getProviderInfo = (provider) => {
    switch (provider.id) {
      case 'openai':
        return 'GPT-4 - מתקדם וחכם';
      case 'together':
        return 'Llama 3.1 - מהיר ויעיל';
      case 'gemini':
        return 'Gemini - מתמחה בשיחות';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      {/* Status Message */}
      {status && (
        <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 px-3 py-1 rounded-md text-sm ${
          status.includes('שגיאה') || status.includes('error')
            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        }`}>
          {status.includes('שגיאה') || status.includes('error') ? (
            <AlertCircle className="h-4 w-4 inline ml-1" />
          ) : (
            <Check className="h-4 w-4 inline ml-1" />
          )}
          {status}
        </div>
      )}

      {/* Provider Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg border transition-all duration-200 ${
          isDarkMode
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        title="בחר ספק AI"
      >
        {getProviderIcon(currentProvider)}
        <span className="text-sm font-medium">
          {AI_PROVIDERS[currentProvider.toUpperCase()]?.name || 'AI Provider'}
        </span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg border z-20 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-2">
              <div className={`text-xs font-semibold px-2 py-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                ספקי AI זמינים
              </div>
              
              {Object.values(AI_PROVIDERS).map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    handleProviderSelect(provider.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-md transition-colors duration-200 ${
                    currentProvider === provider.id
                      ? isDarkMode
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-blue-50 text-blue-700'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-200'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-md ${
                      currentProvider === provider.id
                        ? 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getProviderIcon(provider.id)}
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {provider.icon} {provider.name}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {getProviderInfo(provider)}
                      </div>
                    </div>
                  </div>
                  
                  {currentProvider === provider.id && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Footer Info */}
            <div className={`border-t px-3 py-2 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                המערכת תשמור על זיכרון השיחה
                <br />
                גם בעת החלפת ספקים
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIProviderSelector;
