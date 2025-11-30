
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isApproved: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived states
  const isAdmin = userProfile?.role === 'admin';
  const isApproved = userProfile?.status === 'approved' || userProfile?.role === 'admin';

  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data() as UserProfile;
        setUserProfile(data);
        // Update last login
        await updateDoc(userDocRef, { lastLogin: Date.now() });
      } else {
        // Create new user profile
        // AUTO ADMIN LOGIC: If you want a specific email to be admin automatically for setup
        // Replace 'admin@basherkella.com' with your actual email to bootstrap
        const isAutoAdmin = firebaseUser.email === 'admin@basherkella.com'; 
        
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phone: firebaseUser.phoneNumber,
          role: isAutoAdmin ? 'admin' : 'user',
          status: isAutoAdmin ? 'approved' : 'pending', // Default is PENDING
          createdAt: Date.now(),
          lastLogin: Date.now()
        };

        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error("Error fetching/creating user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      // fetchUserProfile is handled by onAuthStateChanged
    } catch (error) {
      console.error("Google Sign In Context Error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error("Logout Error", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isAdmin, 
      isApproved,
      signInWithGoogle, 
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
