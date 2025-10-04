import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(functions.config().gemini?.api_key || '');

// Callable function to interact with Gemini
export const callGemini = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { prompt, agents, conversationHistory } = data;
  const userId = context.auth.uid;

  try {
    // Check user quota
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Check if user has exceeded quota
    if (userData.plan === 'free' && userData.quota.messagesUsedToday >= userData.quota.messagesLimitDaily) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily message limit reached');
    }

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
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

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Update user quota
    await admin.firestore().collection('users').doc(userId).update({
      'quota.messagesUsedToday': admin.firestore.FieldValue.increment(1)
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
      quotaLimit: userData.quota.messagesLimitDaily
    };

  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate response');
  }
});

// Function to reset daily quotas (should be called by a scheduled function)
export const resetDailyQuotas = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const usersSnapshot = await admin.firestore().collection('users').get();
  const batch = admin.firestore().batch();
  const today = new Date().toISOString().split('T')[0];

  usersSnapshot.docs.forEach((doc) => {
    const userData = doc.data();
    if (userData.quota && userData.quota.lastResetDate !== today) {
      batch.update(doc.ref, {
        'quota.messagesUsedToday': 0,
        'quota.lastResetDate': today
      });
    }
  });

  await batch.commit();
  console.log('Daily quotas reset successfully');
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
