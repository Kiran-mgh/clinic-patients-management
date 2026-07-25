import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyChXJcqXOOVrLG2gQjCuduWm8Y-862Vv1o',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'amar-ayurveda.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'amar-ayurveda',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'amar-ayurveda.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1013444455823',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1013444455823:web:5317b6290f6b5b14c770c0',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
