
"use client";

import { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
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
      // 먼저 userRoles 컬렉션에서 사용자 역할 확인
      const userRolesQuery = query(
        collection(db, 'userRoles'),
        where('email', '==', firebaseUser.email),
        where('isActive', '==', true)
      );
      const userRolesSnapshot = await getDocs(userRolesQuery);

      if (!userRolesSnapshot.empty) {
        // userRoles에서 찾은 역할 사용
        const userRoleDoc = userRolesSnapshot.docs[0];
        const userRoleData = userRoleDoc.data();
        // 역할 매핑
        let role: '본사 관리자' | '가맹점 관리자' | '직원';
        switch (userRoleData.role) {
          case 'hq_manager':
            role = '본사 관리자';
            break;
          case 'branch_manager':
            role = '가맹점 관리자';
            break;
          case 'branch_user':
            role = '직원';
            break;
          default:
            role = '직원';
        }

        return { 
          ...firebaseUser, 
          role, 
          franchise: userRoleData.branchName || '미지정' 
        } as UserProfile;
      }

      // userRoles에 없으면 기존 users 컬렉션 사용
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
