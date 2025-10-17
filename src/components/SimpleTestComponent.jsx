import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

const SimpleTestComponent = () => {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testAI = async () => {
    setIsLoading(true);
    setTestResult('מנסה להתחבר ל-AI...');
    
    try {
      // Call Firebase Function instead of direct API call
      const callGemini = httpsCallable(functions, 'callGemini');
      const result = await callGemini({
        prompt: 'בדיקה - האם AI עובד?',
        agents: [],
        conversationHistory: []
      });
      
      if (result.data && result.data.response) {
        setTestResult(`✅ AI עובד! תגובה: ${result.data.response}`);
      } else {
        setTestResult(`⚠️ תגובה לא צפויה: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      setTestResult(`❌ שגיאה: ${error.message || 'Unknown error'}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        🧪 בדיקת AI פשוטה
      </h2>
      
      <button
        onClick={testAI}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'בודק...' : 'בדוק AI'}
      </button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-sm">{testResult}</p>
        </div>
      )}
    </div>
  );
};

export default SimpleTestComponent;
