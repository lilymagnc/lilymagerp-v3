
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

// 누락된 환경 변수 확인 (빌드 시에는 경고만 출력)
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);

if (missingVars.length > 0) {
  const errorMessage = `Missing required Firebase environment variables: ${missingVars.join(', ')}. Please create a .env.local file with your Firebase configuration.`;
  
  // 빌드 시에는 에러를 던지지 않고 경고만 출력
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Firebase configuration warning:', errorMessage);
    // 기본값으로 더미 설정 사용
    Object.keys(requiredEnvVars).forEach(key => {
      if (!requiredEnvVars[key as keyof typeof requiredEnvVars]) {
        (requiredEnvVars as any)[key] = `dummy-${key}`;
      }
    });
  } else {
    throw new Error(errorMessage);
  }
}

const firebaseConfig = requiredEnvVars;

// Initialize Firebase
let app: any;
let auth: any;
let storage: any;
let db: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  storage = getStorage(app);
  
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
  } catch (error) {
    console.error('Firestore initialization error:', error);
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // 빌드 시에는 더미 객체 사용
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    app = null;
    auth = null;
    storage = null;
    db = null;
  } else {
    throw error;
  }
}

export { app, auth, db, storage };
