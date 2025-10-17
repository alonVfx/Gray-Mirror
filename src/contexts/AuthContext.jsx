import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, analytics, logEvent, googleProvider } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUser({ ...user, ...userDoc.data() });
        } else {
          // Create user document if it doesn't exist
          const userData = {
            email: user.email,
            plan: 'free',
            quota: {
              messagesUsedToday: 0,
              messagesLimitDaily: 200,
              lastResetDate: new Date().toISOString().split('T')[0]
            },
            createdAt: new Date().toISOString(),
            emailVerified: user.emailVerified
          };
          await setDoc(doc(db, 'users', user.uid), userData);
          setUser({ ...user, ...userData });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

          const signup = async (email, password) => {
            try {
              const result = await createUserWithEmailAndPassword(auth, email, password);
              await sendEmailVerification(result.user);

              // Track user signup
              if (analytics) {
                logEvent(analytics, 'sign_up', {
                  method: 'email'
                });
              }

              return result;
            } catch (error) {
              // Provide more user-friendly error messages
              if (error.code === 'auth/email-already-in-use') {
                throw new Error('כתובת האימייל כבר בשימוש. נסה להתחבר או השתמש בכתובת אחרת.');
              } else if (error.code === 'auth/weak-password') {
                throw new Error('הסיסמה חלשה מדי. בחר סיסמה עם לפחות 6 תווים.');
              } else if (error.code === 'auth/invalid-email') {
                throw new Error('כתובת אימייל לא תקינה.');
              } else {
                throw new Error('שגיאה ביצירת חשבון: ' + error.message);
              }
            }
          };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Track user login
      if (analytics) {
        logEvent(analytics, 'login', {
          method: 'email'
        });
      }
      
      return result;
    } catch (error) {
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('משתמש לא נמצא. בדוק את כתובת האימייל או הירשם.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('סיסמה שגויה. נסה שוב.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('כתובת אימייל לא תקינה.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('יותר מדי ניסיונות. נסה שוב מאוחר יותר.');
      } else {
        throw new Error('שגיאה בהתחברות: ' + error.message);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Track Google sign-in
      if (analytics) {
        logEvent(analytics, 'login', {
          method: 'google'
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Track user logout
      if (analytics) {
        logEvent(analytics, 'logout');
      }
      
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    signup,
    login,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
