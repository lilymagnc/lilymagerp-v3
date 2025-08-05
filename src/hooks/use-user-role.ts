"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { 
  UserRole, 
  UserRoleType, 
  Permission, 
  CreateUserRoleData
} from '@/types/user-role';
import { ROLE_PERMISSIONS } from '@/types/user-role';

// 임시로 현재 사용자 ID를 하드코딩 (실제로는 인증 시스템에서 가져와야 함)
const CURRENT_USER_ID = 'current-user-id';

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 사용자 역할 조회
  const fetchUserRole = useCallback(async (userId: string = CURRENT_USER_ID) => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'userRoles'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const roleDoc = querySnapshot.docs[0];
        const roleData = roleDoc.data();
        const role: UserRole = {
          id: roleDoc.id,
          ...roleData,
          createdAt: roleData.createdAt,
          updatedAt: roleData.updatedAt,
        } as UserRole;
        
        setUserRole(role);
      } else {
        // 역할이 없는 경우 기본 지점 사용자로 설정
        await createDefaultUserRole(userId);
      }
    } catch (error) {
      console.error('사용자 역할 조회 오류:', error);
      toast({
        variant: 'destructive',
        title: '역할 조회 실패',
        description: '사용자 역할을 조회하는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 기본 사용자 역할 생성 (기존 인증 시스템 역할 기반)
  const createDefaultUserRole = async (userId: string) => {
    try {
      const { UserRoleType } = await import('@/types/user-role');
      
      // 기본적으로 본사 관리자로 설정 (기존 시스템에서 이미 본사 관리자로 설정됨)
      const defaultRoleData: CreateUserRoleData = {
        userId,
        role: UserRoleType.HQ_MANAGER, // 본사 관리자로 설정
        // branchId와 branchName은 본사 관리자의 경우 제외
      };
      
      await createUserRole(defaultRoleData);
    } catch (error) {
      console.error('기본 역할 생성 오류:', error);
    }
  };

  // 사용자 역할 생성
  const createUserRole = async (roleData: CreateUserRoleData): Promise<string> => {
    try {
      
      const now = serverTimestamp();
      const userRoleDoc: any = {
        userId: roleData.userId,
        role: roleData.role,
        permissions: ROLE_PERMISSIONS[roleData.role],
        createdAt: now as any,
        updatedAt: now as any,
        isActive: true
      };

      // branchId와 branchName이 있는 경우에만 추가 (undefined 방지)
      if (roleData.branchId) {
        userRoleDoc.branchId = roleData.branchId;
      }
      if (roleData.branchName) {
        userRoleDoc.branchName = roleData.branchName;
      }

      const docRef = doc(collection(db, 'userRoles'));
      await setDoc(docRef, userRoleDoc);
      
      // 현재 사용자의 역할을 생성한 경우 상태 업데이트
      if (roleData.userId === CURRENT_USER_ID) {
        setUserRole({
          id: docRef.id,
          ...userRoleDoc,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        });
      }

      toast({
        title: '역할 생성 완료',
        description: '사용자 역할이 성공적으로 생성되었습니다.',
      });

      return docRef.id;
    } catch (error) {
      console.error('사용자 역할 생성 오류:', error);
      toast({
        variant: 'destructive',
        title: '역할 생성 실패',
        description: '사용자 역할 생성 중 오류가 발생했습니다.',
      });
      throw error;
    }
  };

  // 사용자 역할 업데이트
  const updateUserRole = async (
    roleId: string, 
    updates: Partial<Pick<UserRole, 'role' | 'branchId' | 'branchName' | 'permissions' | 'isActive'>>
  ): Promise<void> => {
    try {
      const docRef = doc(db, 'userRoles', roleId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updateData, { merge: true });

      // 현재 사용자의 역할을 업데이트한 경우 상태 업데이트
      if (userRole && userRole.id === roleId) {
        setUserRole({
          ...userRole,
          ...updates,
          updatedAt: new Date() as any,
        });
      }

      toast({
        title: '역할 업데이트 완료',
        description: '사용자 역할이 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      console.error('사용자 역할 업데이트 오류:', error);
      toast({
        variant: 'destructive',
        title: '역할 업데이트 실패',
        description: '사용자 역할 업데이트 중 오류가 발생했습니다.',
      });
      throw error;
    }
  };

  // 권한 확인 함수들
  const hasPermission = (permission: Permission): boolean => {
    if (!userRole || !userRole.isActive) return false;
    return userRole.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!userRole || !userRole.isActive) return false;
    return permissions.some(permission => userRole.permissions.includes(permission));
  };

  const isHQManager = (): boolean => {
    return userRole?.role === 'hq_manager' && userRole.isActive;
  };

  const isBranchUser = (): boolean => {
    return userRole?.role === 'branch_user' && userRole.isActive;
  };

  const isAdmin = (): boolean => {
    return userRole?.role === 'admin' && userRole.isActive;
  };

  // 테스트용: 사용자 역할 강제 재설정
  const resetUserRole = async () => {
    try {
      console.log('역할 재설정 시작...');
      
      // 기존 역할 삭제
      const q = query(
        collection(db, 'userRoles'),
        where('userId', '==', CURRENT_USER_ID)
      );
      const querySnapshot = await getDocs(q);
      
      console.log('기존 역할 문서 수:', querySnapshot.docs.length);
      
      // 기존 문서들 비활성화
      for (const docSnapshot of querySnapshot.docs) {
        await setDoc(docSnapshot.ref, { isActive: false }, { merge: true });
        console.log('기존 문서 비활성화:', docSnapshot.id);
      }
      
      // 새 본사 관리자 역할 직접 생성
      const { UserRoleType } = await import('@/types/user-role');
      const now = serverTimestamp();
      const newUserRole: any = {
        userId: CURRENT_USER_ID,
        role: UserRoleType.HQ_MANAGER,
        permissions: ROLE_PERMISSIONS[UserRoleType.HQ_MANAGER],
        createdAt: now as any,
        updatedAt: now as any,
        isActive: true
      };
      
      // branchId와 branchName은 본사 관리자의 경우 포함하지 않음

      const docRef = doc(collection(db, 'userRoles'));
      await setDoc(docRef, newUserRole);
      
      console.log('새 본사 관리자 역할 생성:', docRef.id);
      
      // 상태 즉시 업데이트
      setUserRole({
        id: docRef.id,
        ...newUserRole,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      });
      
      toast({
        title: '역할 재설정 완료',
        description: '본사 관리자 역할로 설정되었습니다.',
      });
      
      // 페이지 새로고침으로 확실히 적용
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('역할 재설정 오류:', error);
      toast({
        variant: 'destructive',
        title: '역할 재설정 실패',
        description: '역할 재설정 중 오류가 발생했습니다.',
      });
    }
  };

  // 컴포넌트 마운트 시 사용자 역할 조회
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return {
    userRole,
    loading,
    fetchUserRole,
    createUserRole,
    updateUserRole,
    resetUserRole, // 테스트용 함수 추가
    hasPermission,
    hasAnyPermission,
    isHQManager,
    isBranchUser,
    isAdmin,
  };
}