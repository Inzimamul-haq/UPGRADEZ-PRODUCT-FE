import { initializeApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// All NEXT_PUBLIC_FIREBASE_* vars are declared in .env and exposed by Next.js at build time.
// Access via process.env only — never import or read the .env file directly.
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// getMessaging is only valid in browser context — guard against SSR
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
