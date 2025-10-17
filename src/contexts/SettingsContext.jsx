import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const SettingsContext = createContext();

// Default settings (fallback)
const defaultSettings = {
  quota: {
    freeMessagesDaily: 200,
    premiumMessagesDaily: 0,
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

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to settings changes in real-time
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'global'),
      (doc) => {
        if (doc.exists()) {
          setSettings(doc.data());
        } else {
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

