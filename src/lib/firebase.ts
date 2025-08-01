
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 환경 변수 검증
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 누락된 환경 변수 확인
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
    'Please create a .env.local file with your Firebase configuration.'
  );
}

const firebaseConfig = requiredEnvVars;

// Initialize Firebase
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const storage = getStorage(app);

let db;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
} catch (error) {
  console.error('Firestore initialization error:', error);
  // Fallback to default Firestore initialization
  db = getFirestore(app);
}

export { app, auth, db, storage };
