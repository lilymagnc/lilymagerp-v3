
"use client";

import { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export interface UserProfile extends User {
  role?: '본사 관리자' | '가맹점 관리자' | '직원';
  franchise?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.email) return firebaseUser;
    
    try {
      const userDocRef = doc(db, 'users', firebaseUser.email);
      let userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // 기존 로직: 새 사용자 자동 생성
        const usersCollectionRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);
        const isFirstUser = usersSnapshot.empty;
        
        const newUserProfile = {
          email: firebaseUser.email,
          role: isFirstUser ? '본사 관리자' : '직원',
          franchise: isFirstUser ? '본사' : '미지정',
        };
        
        await setDoc(userDocRef, newUserProfile);
        userDoc = await getDoc(userDocRef);
      } else {
        // 이미 관리자가 미리 등록한 사용자 정보가 있는 경우
        console.log('기존 등록된 사용자 정보를 사용합니다:', userDoc.data());
      }
      
      const userData = userDoc.data();
      return { ...firebaseUser, role: userData?.role, franchise: userData?.franchise } as UserProfile;
    } catch (error) {
      console.error("Error fetching or creating user role:", error);
    }
    return firebaseUser;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userWithRole = await fetchUserRole(firebaseUser);
        setUser(userWithRole);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserRole]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
