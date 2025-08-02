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

// Initialize Firebase
let app;
let auth;
let storage;
let db;

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
  throw error;
}

export { app, auth, db, storage };
