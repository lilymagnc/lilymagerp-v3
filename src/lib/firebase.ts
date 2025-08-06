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
  console.log('Firebase 초기화 시작...');
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase 앱 초기화 완료');
  
  auth = getAuth(app);
  console.log('Firebase Auth 초기화 완료');
  
  storage = getStorage(app);
  console.log('Firebase Storage 초기화 완료');
  
  try {
    console.log('Firestore 초기화 시작...');
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
    console.log('Firestore 초기화 완료');
  } catch (error) {
    console.error('Firestore initialization error:', error);
    console.log('Fallback to getFirestore...');
    db = getFirestore(app);
    console.log('Fallback Firestore 초기화 완료');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { app, auth, db, storage };
