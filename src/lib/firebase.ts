
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase 설정 (직접 하드코딩)
const firebaseConfig = {
  apiKey: "AIzaSyApy5zme7H15h1UZd1B9hBDOOWgpbvOLJ4",
  authDomain: "lilymagerp-fs1.firebaseapp.com",
  databaseURL: "https://lilymagerp-fs1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lilymagerp-fs1",
  storageBucket: "lilymagerp-fs1.firebasestorage.app",
  messagingSenderId: "1069828102888",
  appId: "1:1069828102888:web:24927eab4719f3e75d475d",
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
