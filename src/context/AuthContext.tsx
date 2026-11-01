import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from '../lib/firebase';
import { UserProfile, RelationshipStatus } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or initialize user profile in Firestore
  const syncProfile = async (user: FirebaseUser) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'visiteur@intima.app',
          displayName: user.displayName || (user.isAnonymous ? 'Visiteur Intima' : 'Ami(e)'),
          relationshipStatus: 'single',
          subscriptionTier: 'free',
          anonymousMode: false,
          dataRetentionDays: 30,
          preferredVoice: 'Kore',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      // Fallback in-memory profile if permissions or offline
      setUserProfile({
        uid: user.uid,
        email: user.email || 'visiteur@intima.app',
        displayName: user.displayName || 'Invité(e)',
        relationshipStatus: 'single',
        subscriptionTier: 'free',
        anonymousMode: false,
        dataRetentionDays: 30,
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await syncProfile(res.user);
      }
    } catch (error) {
      console.error('Erreur connexion Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await syncProfile(res.user);
      }
    } catch (error) {
      console.error('Erreur connexion Email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const newProfile: UserProfile = {
          uid: res.user.uid,
          email: email,
          displayName: name,
          relationshipStatus: 'single',
          subscriptionTier: 'free',
          anonymousMode: false,
          dataRetentionDays: 30,
          preferredVoice: 'Kore',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', res.user.uid), newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Erreur inscription Email:', error);
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      const res = await signInAnonymously(auth);
      if (res.user) {
        await syncProfile(res.user);
      }
    } catch (error) {
      console.error('Erreur mode invité:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    const updated = {
      ...userProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updated);
      setUserProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      setUserProfile(updated);
    }
  };

  const upgradeToPremium = async () => {
    await updateUserProfile({ subscriptionTier: 'premium' });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        logout,
        updateUserProfile,
        upgradeToPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
