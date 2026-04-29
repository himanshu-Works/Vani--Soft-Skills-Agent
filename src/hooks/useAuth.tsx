import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/integrations/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured — auth disabled.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Sign In ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      toast({
        title: 'Firebase not configured',
        description: 'Please add your Firebase credentials to the .env file.',
        variant: 'destructive',
      });
      throw new Error('Firebase not configured');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Welcome back! 👋' });
      navigate('/dashboard');
    } catch (error: any) {
      const message = getFriendlyErrorMessage(error.code);
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
      throw error;
    }
  };

  // ─── Sign Up ────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured) {
      toast({
        title: 'Firebase not configured',
        description: 'Please add your Firebase credentials to the .env file.',
        variant: 'destructive',
      });
      throw new Error('Firebase not configured');
    }
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }

      // Send email verification
      await sendEmailVerification(credential.user);

      toast({
        title: 'Account created! 🎉',
        description: 'A verification email has been sent. Please check your inbox.',
      });
      // Don't navigate — let user verify email first
    } catch (error: any) {
      const message = getFriendlyErrorMessage(error.code);
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' });
      throw error;
    }
  };

  // ─── Google Sign-In ─────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      toast({
        title: 'Firebase not configured',
        description:
          'Google Sign-In requires Firebase. Please add your Firebase credentials to the .env file. See the setup guide for instructions.',
        variant: 'destructive',
      });
      throw new Error('Firebase not configured');
    }
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: 'Signed in with Google! 🎉' });
      navigate('/dashboard');
    } catch (error: any) {
      // Ignore popup-closed-by-user errors silently
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      const message = getFriendlyErrorMessage(error.code);
      toast({ title: 'Google sign-in failed', description: message, variant: 'destructive' });
      throw error;
    }
  };

  // ─── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      toast({ title: 'Signed out successfully' });
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Sign out failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, isConfigured: isFirebaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ─── Error Message Helper ────────────────────────────────────────────────────
function getFriendlyErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site and try again.',
    'auth/unauthorized-domain':
      'This domain is not authorized in Firebase. Add it under Firebase Console → Authentication → Settings → Authorized Domains.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled. Please enable it in Firebase Console → Authentication → Sign-in Methods.',
  };
  return messages[code] || `Authentication error (${code}). Please try again.`;
}
