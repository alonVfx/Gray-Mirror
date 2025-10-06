// AI Providers Configuration
export const AI_PROVIDERS = {
  OPENAI: {
    name: 'OpenAI',
    id: 'openai',
    model: 'gpt-4o',
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 4000,
    temperature: 0.7,
    icon: '🤖'
  },
  TOGETHER: {
    name: 'Together AI',
    id: 'together',
    model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    apiKey: process.env.REACT_APP_TOGETHER_API_KEY || '',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    maxTokens: 4000,
    temperature: 0.7,
    icon: '🚀'
  },
  GEMINI: {
    name: 'Google Gemini',
    id: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    maxTokens: 4000,
    temperature: 0.7,
    icon: '🧠'
  }
};

// Default provider
export const DEFAULT_PROVIDER = 'together';

// Session management configuration
export const SESSION_CONFIG = {
  MAX_MESSAGES_PER_SESSION: 50,
  SUMMARY_TRIGGER_THRESHOLD: 40, // When to start preparing summary
  MEMORY_WINDOW_SIZE: 20, // How many recent messages to keep in context
  SUMMARIZATION_PROMPT: `אתה סוכם שיחות מומחה. סיכום את השיחה הבאה בצורה טבעית ומפורטת, 
  תוך שמירה על הקשר והרגש. הסיכום צריך להכיל:
  1. הנושאים העיקריים שנדונו
  2. נקודות המפתח של כל משתתף
  3. החלטות או מסקנות שהתקבלו
  4. האווירה הכללית של השיחה
  
  כתוב את הסיכום בעברית, בצורה טבעית כאילו אתה מספר לחבר על השיחה.`
};

// Memory management
export class ConversationMemory {
  constructor() {
    this.messages = [];
    this.summaries = [];
    this.currentSessionId = null;
  }

  addMessage(message) {
    this.messages.push({
      ...message,
      timestamp: new Date(),
      sessionId: this.currentSessionId
    });
  }

  getRecentMessages(count = SESSION_CONFIG.MEMORY_WINDOW_SIZE) {
    return this.messages.slice(-count);
  }

  getContextForAI() {
    const recentMessages = this.getRecentMessages();
    const previousSummaries = this.summaries.slice(-2); // Last 2 summaries
    
    return {
      recentMessages,
      summaries: previousSummaries,
      totalMessages: this.messages.length
    };
  }

  shouldTriggerSummary() {
    return this.messages.length >= SESSION_CONFIG.SUMMARY_TRIGGER_THRESHOLD;
  }

  createSummary(summaryText) {
    this.summaries.push({
      text: summaryText,
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      messageCount: this.messages.length
    });
  }

  startNewSession() {
    this.currentSessionId = `session_${Date.now()}`;
  }

  reset() {
    this.messages = [];
    this.summaries = [];
    this.currentSessionId = null;
  }
}

// AI Provider Interface
export class AIProviderManager {
  constructor() {
    this.currentProvider = DEFAULT_PROVIDER;
    this.memory = new ConversationMemory();
  }

  setProvider(providerId) {
    if (AI_PROVIDERS[providerId.toUpperCase()]) {
      this.currentProvider = providerId.toLowerCase();
      return true;
    }
    return false;
  }

  getCurrentProvider() {
    return AI_PROVIDERS[this.currentProvider.toUpperCase()];
  }

  async generateResponse(prompt, conversationContext) {
    const provider = this.getCurrentProvider();
    
    // Add to memory
    this.memory.addMessage({
      role: 'user',
      content: prompt,
      timestamp: new Date()
    });

    // Get context
    const context = this.memory.getContextForAI();
    
    // Check if we need to create a summary
    if (this.memory.shouldTriggerSummary()) {
      await this.createConversationSummary();
    }

    try {
      let response;
      
      switch (provider.id) {
        case 'openai':
          response = await this.callOpenAI(prompt, context, provider);
          break;
        case 'together':
          response = await this.callTogether(prompt, context, provider);
          break;
        case 'gemini':
          response = await this.callGemini(prompt, context, provider);
          break;
        default:
          throw new Error(`Unknown provider: ${provider.id}`);
      }

      // Add AI response to memory
      this.memory.addMessage({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error);
      
      // Fallback to another provider
      const fallbackProvider = this.getFallbackProvider();
      if (fallbackProvider && fallbackProvider.id !== provider.id) {
        console.log(`Falling back to ${fallbackProvider.name}`);
        this.setProvider(fallbackProvider.id);
        return this.generateResponse(prompt, conversationContext);
      }
      
      throw error;
    }
  }

  getFallbackProvider() {
    // Simple fallback logic - could be more sophisticated
    const providers = Object.values(AI_PROVIDERS);
    const current = this.getCurrentProvider();
    return providers.find(p => p.id !== current.id);
  }

  async createConversationSummary() {
    const context = this.memory.getContextForAI();
    const recentMessages = context.recentMessages.slice(-10); // Last 10 messages
    
    const summaryPrompt = `${SESSION_CONFIG.SUMMARIZATION_PROMPT}
    
שיחה אחרונה:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

    try {
      const provider = this.getCurrentProvider();
      let summary;
      
      switch (provider.id) {
        case 'openai':
          summary = await this.callOpenAI(summaryPrompt, { recentMessages: [] }, provider);
          break;
        case 'together':
          summary = await this.callTogether(summaryPrompt, { recentMessages: [] }, provider);
          break;
        case 'gemini':
          summary = await this.callGemini(summaryPrompt, { recentMessages: [] }, provider);
          break;
      }
      
      this.memory.createSummary(summary);
      
      // Clear old messages to free memory, keep only recent ones
      this.memory.messages = this.memory.messages.slice(-SESSION_CONFIG.MEMORY_WINDOW_SIZE);
      
      return summary;
    } catch (error) {
      console.error('Error creating summary:', error);
      return null;
    }
  }

  // OpenAI API call
  async callOpenAI(prompt, context, provider) {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          ...context.recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: prompt }
        ],
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Together AI API call
  async callTogether(prompt, context, provider) {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          ...context.recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: prompt }
        ],
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Gemini API call (using existing Firebase function)
  async callGemini(prompt, context, provider) {
    // This will use the existing Firebase function
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../firebase/config');
    
    const callGemini = httpsCallable(functions, 'callGemini');
    
    const result = await callGemini({
      prompt: prompt,
      agents: context.agents || [],
      conversationHistory: context.recentMessages
    });

    return result.data.response;
  }

  // Get conversation summary for display
  getConversationSummary() {
    return this.memory.summaries;
  }

  // Start new conversation session
  startNewConversation() {
    this.memory.startNewSession();
  }

  // Reset everything
  reset() {
    this.memory.reset();
  }
}

// Export singleton instance
export const aiManager = new AIProviderManager();
