// Run this script once to initialize default settings in Firestore
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const defaultSettings = {
  quota: {
    freeMessagesDaily: 200,
    premiumMessagesDaily: 0, // 0 = unlimited
  },
  defaultParticipants: [
    { name: 'אליס', identity: 'מדענית חלל אופטימית' },
    { name: 'בוב', identity: 'אסטרונאוט ציני' }
  ],
  defaultScene: 'תא שליטה של חללית. אזעקה נשמעת.',
  ui: {
    primaryColor: 'blue',
    darkModeDefault: false,
    showWelcomeMessage: true,
    maxParticipants: 10,
    conversationSpeed: 5,
  },
  features: {
    advancedChatEnabled: false,
    podcastsEnabled: false,
    voiceEnabled: false,
    historyEnabled: true,
    agentManagerEnabled: true,
  }
};

export const initializeSettings = async () => {
  try {
    await setDoc(doc(db, 'settings', 'global'), defaultSettings);
    console.log('✅ Settings initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
    return false;
  }
};

// You can call this function from the browser console:
// import { initializeSettings } from './utils/initializeSettings';
// initializeSettings();

