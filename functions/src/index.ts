import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
admin.initializeApp();

// API Keys from environment variables (set via Firebase config)
// To set: firebase functions:config:set openai.key="YOUR_KEY" together.key="YOUR_KEY" gemini.key="YOUR_KEY"
const OPENAI_API_KEY = functions.config().openai?.key;
const TOGETHER_API_KEY = functions.config().together?.key;
const GEMINI_API_KEY = functions.config().gemini?.key;

if (!OPENAI_API_KEY || !TOGETHER_API_KEY || !GEMINI_API_KEY) {
  console.warn('⚠️ Warning: Some API keys are missing. Please set them using Firebase config.');
  console.warn('Run: firebase functions:config:set openai.key="YOUR_KEY" together.key="YOUR_KEY" gemini.key="YOUR_KEY"');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper function to call OpenAI API
async function callOpenAI(prompt: string, context: any, agents: any[], conversationHistory: any[]) {
  const messages = [
    ...(conversationHistory || []).slice(-10).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || msg.content
    })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper function to call Together AI API
async function callTogetherAI(prompt: string, context: any, agents: any[], conversationHistory: any[]) {
  const messages = [
    ...(conversationHistory || []).slice(-10).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || msg.content
    })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Together AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string, context: any, agents: any[], conversationHistory: any[]) {
  try {
    // 🔍 DEBUG: Log the exact model being used
    const modelName = 'gemini-2.0-flash';
    console.log('🚀 [GEMINI] Using model:', modelName);
    console.log('🚀 [GEMINI] API Key present:', !!GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        maxOutputTokens: 4000,  // 🎯 Cost control - cap response length
        temperature: 0.7,
      }
    });
    
    // 🔍 DEBUG: Verify model object
    console.log('🚀 [GEMINI] Model object created successfully');
    
    // Create context from agents and conversation history
    let contextPrompt = '';
    if (agents && agents.length > 0) {
      contextPrompt += 'Agents in this conversation:\n';
      agents.forEach((agent: any) => {
        contextPrompt += `- ${agent.name}: ${agent.identity}\n`;
        if (agent.personality) {
          contextPrompt += `  Personality: ${agent.personality}\n`;
        }
      });
      contextPrompt += '\n';
    }

    if (conversationHistory && conversationHistory.length > 0) {
      contextPrompt += 'Recent conversation history:\n';
      conversationHistory.slice(-10).forEach((msg: any) => {
        contextPrompt += `${msg.sender}: ${msg.text}\n`;
      });
      contextPrompt += '\n';
    }

    const fullPrompt = `${contextPrompt}User message: ${prompt}\n\nPlease respond in Hebrew, keeping the conversation natural and engaging.`;
    
    console.log('🚀 [GEMINI] About to call generateContent...');
    const result = await model.generateContent(fullPrompt);
    console.log('🚀 [GEMINI] generateContent successful, getting response...');
    
    const response = await result.response;
    const responseText = response.text();
    
    console.log('🚀 [GEMINI] Response length:', responseText?.length || 0);
    return responseText;
    
  } catch (error: any) {
    console.error('❌ [GEMINI] Error details:', {
      error: error.message,
      stack: error.stack,
      model: 'gemini-1.5-flash',
      apiKeyPresent: !!GEMINI_API_KEY
    });
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

// Callable function to interact with AI providers
export const callAI = functions.https.onCall(async (data, context) => {
  // 🔒 SECURITY: Immediate authentication check
  if (!context.auth || !context.auth.uid) {
    console.log('❌ No authentication context found');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { prompt, agents, conversationHistory, provider = 'gemini' } = data;
  
  console.log('🚀 Processing request for user:', userId, 'with provider:', provider);

  try {
    // 🔒 SECURITY: Check user quota BEFORE making expensive API calls
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // 🎯 QUOTA: Enhanced quota checking with detailed logging
    const currentUsage = userData.quota?.messagesUsedToday || 0;
    const dailyLimit = userData.quota?.messagesLimitDaily || 200;
    
    console.log(`📊 [QUOTA] User ${userId}: ${currentUsage}/${dailyLimit} messages used today`);
    
    if (userData.plan === 'free' && currentUsage >= dailyLimit) {
      console.log(`❌ [QUOTA] User ${userId} exceeded daily limit`);
      throw new functions.https.HttpsError('resource-exhausted', 'Daily message limit reached');
    }

    // 🚨 RATE LIMIT: Basic rate limiting check
    const now = Date.now();
    const lastRequest = userData.lastAIRequest || 0;
    const timeDiff = now - lastRequest;
    
    if (timeDiff < 2000) { // 2 second rate limit
      console.log(`⚠️ [RATE] User ${userId} requesting too frequently`);
      throw new functions.https.HttpsError('resource-exhausted', 'Please wait before sending another message');
    }

    // Generate response using the selected AI provider
    let text: string;
    switch (provider.toLowerCase()) {
      case 'openai':
        text = await callOpenAI(prompt, context, agents, conversationHistory);
        break;
      case 'together':
        text = await callTogetherAI(prompt, context, agents, conversationHistory);
        break;
      case 'gemini':
      default:
        text = await callGeminiAPI(prompt, context, agents, conversationHistory);
        break;
    }

    // Update user quota and rate limiting timestamp
    await admin.firestore().collection('users').doc(userId).update({
      'quota.messagesUsedToday': admin.firestore.FieldValue.increment(1),
      'lastAIRequest': admin.firestore.FieldValue.serverTimestamp()
    });

    // Save conversation to Firestore
    const conversationRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc();

    await conversationRef.set({
      userMessage: prompt,
      aiResponse: text,
      agents: agents || [],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId
    });

    return {
      response: text,
      quotaUsed: userData.quota.messagesUsedToday + 1,
      quotaLimit: userData.quota.messagesLimitDaily,
      provider: provider
    };

  } catch (error: any) {
    console.error('Error calling AI provider:', error);
    // Return a more detailed error message
    return {
      response: `שגיאה: ${error.message}`,
      error: error.message,
      quotaUsed: 0,
      quotaLimit: 200
    };
  }
});

// Backward compatibility - keep the old callGemini function
export const callGemini = functions.https.onCall(async (data, context) => {
  console.log('🔄 [BACKWARD] callGemini called, redirecting to callAI with gemini provider');
  // Call the new callAI function directly with gemini as the provider
  const newData = { ...data, provider: 'gemini' };
  return await callAI.run(newData, context);
});

// Simple test function for debugging
export const testFunction = functions.https.onCall(async (data, context) => {
  console.log('testFunction called');
  return {
    message: 'Test function working!',
    timestamp: new Date().toISOString(),
    data: data,
    auth: context.auth ? 'authenticated' : 'not authenticated'
  };
});

// Function to reset daily quotas (should be called by a scheduled function)
export const resetDailyQuotas = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Jerusalem') // 🕐 Set proper timezone
  .onRun(async (context) => {
    console.log('🔄 [SCHEDULED] Starting daily quota reset...');
    
    try {
      const usersSnapshot = await admin.firestore().collection('users').get();
      const batch = admin.firestore().batch();
      const today = new Date().toISOString().split('T')[0];
      let resetCount = 0;

      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        if (userData.quota && userData.quota.lastResetDate !== today) {
          batch.update(doc.ref, {
            'quota.messagesUsedToday': 0,
            'quota.lastResetDate': today,
            'lastQuotaReset': admin.firestore.FieldValue.serverTimestamp()
          });
          resetCount++;
        }
      });

      if (resetCount > 0) {
        await batch.commit();
        console.log(`✅ [SCHEDULED] Daily quotas reset successfully for ${resetCount} users`);
      } else {
        console.log('ℹ️ [SCHEDULED] No users required quota reset');
      }
    } catch (error) {
      console.error('❌ [SCHEDULED] Error resetting daily quotas:', error);
    }
  });

// Function to get user statistics (for admin dashboard)
export const getUserStats = functions.https.onCall(async (data, context) => {
  // Verify user is admin
  if (!context.auth || context.auth.token.email !== 'admin@graymirror.com') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const stats = {
      totalUsers: usersSnapshot.size,
      activeUsers: 0,
      premiumUsers: 0,
      totalMessages: 0
    };

    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      if (userData.plan === 'premium') {
        stats.premiumUsers++;
      }
      if (userData.quota) {
        stats.totalMessages += userData.quota.messagesUsedToday || 0;
      }
      // Check if user was active in the last 24 hours
      if (userData.lastActive) {
        const lastActive = userData.lastActive.toDate();
        const now = new Date();
        const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
          stats.activeUsers++;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get user statistics');
  }
});
