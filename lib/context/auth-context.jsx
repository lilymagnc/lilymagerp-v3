"use client";
import { createContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
export const AuthContext = createContext({ user: null, loading: true });
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchUserRole = useCallback(async (firebaseUser) => {
        if (!firebaseUser.email)
            return firebaseUser;
        try {
            const userDocRef = doc(db, 'users', firebaseUser.email);
            let userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                const usersCollectionRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollectionRef);
                const isFirstUser = usersSnapshot.empty;
                const newUserProfile = {
                    email: firebaseUser.email,
                    role: isFirstUser ? '본사 관리자' : '직원',
                    franchise: isFirstUser ? '본사' : '미지정',
                };
                await setDoc(userDocRef, newUserProfile);
                userDoc = await getDoc(userDocRef); // Re-fetch the document
            }
            const userData = userDoc.data();
            return Object.assign(Object.assign({}, firebaseUser), { role: userData === null || userData === void 0 ? void 0 : userData.role, franchise: userData === null || userData === void 0 ? void 0 : userData.franchise });
        }
        catch (error) {
            console.error("Error fetching or creating user role:", error);
        }
        return firebaseUser;
    }, []);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userWithRole = await fetchUserRole(firebaseUser);
                setUser(userWithRole);
            }
            else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [fetchUserRole]);
    if (loading) {
        return (<div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>);
};
