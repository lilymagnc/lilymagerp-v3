import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('Firebase 연결 테스트 시작...');

    // Firebase 설정 확인
    console.log('Firebase 설정 확인 중...');
    const { app, auth, db } = await import('./firebase');
    console.log('Firebase 앱:', app);
    console.log('Firebase Auth:', auth);
    console.log('Firestore db:', db);

    // 인증 상태 확인
    const currentUser = auth.currentUser;
    console.log('현재 인증된 사용자:', currentUser);

    if (!currentUser) {
      return { success: false, error: '인증된 사용자가 없습니다' };
    }

    // 간단한 테스트 문서 생성
    const testDoc = {
      test: true,
      timestamp: serverTimestamp(),
      message: 'Firebase 연결 테스트',
      createdAt: new Date().toISOString(),
      userId: currentUser.uid,
      userEmail: currentUser.email
    };

    console.log('테스트 문서 생성:', testDoc);

    const docRef = await addDoc(collection(db, 'test'), testDoc);
    console.log('Firebase 연결 테스트 성공:', docRef.id);

    // 테스트 문서 삭제 (정리)
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(docRef);
      console.log('테스트 문서 정리 완료');
    } catch (deleteError) {
      console.warn('테스트 문서 삭제 실패 (무시됨):', deleteError);
    }

    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('Firebase 연결 테스트 실패:', error);

    // 상세 오류 정보
    if (error instanceof Error) {
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
    }

    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Firebase 오류 코드:', (error as any).code);
      console.error('Firebase 오류 메시지:', (error as any).message);
    }

    return { success: false, error };
  }
} 