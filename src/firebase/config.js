import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC99vhgBDnv6Y-whD78Li_Qa7cr_xs_vWw",
  authDomain: "gray-mirror-274ac.firebaseapp.com",
  projectId: "gray-mirror-274ac",
  storageBucket: "gray-mirror-274ac.firebasestorage.app",
  messagingSenderId: "147395492761",
  appId: "1:147395492761:web:ae0d619749846b294ff108",
  measurementId: "G-JK787W1X8N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export logEvent for analytics tracking
export { logEvent };

export default app;
