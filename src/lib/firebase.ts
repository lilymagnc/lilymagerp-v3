
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyApy5zme7H15h1UZd1B9hBDOOWgpbvOLJ4",
  authDomain: "lilymagerp-fs1.firebaseapp.com",
  databaseURL: "https://lilymagerp-fs1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lilymagerp-fs1",
  storageBucket: "lilymagerp-fs1.firebasestorage.app",
  messagingSenderId: "1069828102888",
  appId: "1:1069828102888:web:24927eab4719f3e75d475d"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

const db: Firestore = initializeFirestore(app, {
     localCache: memoryLocalCache()
});

export { app, auth, db, storage };
