// Test Firebase connection
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC99vhgBDnv6Y-whD78Li_Qa7cr_xs_vWw",
  authDomain: "gray-mirror-274ac.firebaseapp.com",
  projectId: "gray-mirror-274ac",
  storageBucket: "gray-mirror-274ac.firebasestorage.app",
  messagingSenderId: "147395492761",
  appId: "1:147395492761:web:78f3d8798f4db8704ff108",
  measurementId: "G-7HRLRKBYMX"
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully!');
  console.log('Auth:', auth);
  console.log('Firestore:', db);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}
