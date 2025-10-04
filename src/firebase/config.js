import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your Firebase configuration
// Replace these values with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "gray-mirror-274ac.firebaseapp.com",
  projectId: "gray-mirror-274ac",
  storageBucket: "gray-mirror-274ac.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
