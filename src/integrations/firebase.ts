import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_firebase_api_key' &&
  firebaseConfig.apiKey.length > 10 &&
  !!firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id';

// Initialize Firebase only once
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} else {
  console.warn(
    '⚠️  Firebase is not configured. Auth features will not work.\n' +
    'Please create a .env file with your Firebase credentials.\n' +
    'See .env.example for the required variables.'
  );
  // Create stub instances to avoid import errors
  // These will fail gracefully when isFirebaseConfigured is checked first
  app = null as any;
  auth = null as any;
  googleProvider = new GoogleAuthProvider();
}

export { app, auth, googleProvider };
