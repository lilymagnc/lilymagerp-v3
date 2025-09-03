import { CalendarEvent } from '@/hooks/use-calendar';

export interface User {
  uid?: string;
  role?: string;
  franchise?: string;
}

export function canEditCalendarEvent(user: User | null, event?: CalendarEvent | null): boolean {
  console.log('🔍 권한 확인 - canEditCalendarEvent:', {
    user: user ? {
      uid: user.uid,
      role: user.role,
      franchise: user.franchise
    } : null,
    event: event ? {
      id: event.id,
      title: event.title,
      type: event.type,
      branchName: event.branchName,
      createdBy: event.createdBy,
      createdByRole: event.createdByRole,
      createdByBranch: event.createdByBranch,
      relatedId: event.relatedId
    } : null
  });

  if (!user || !user.role) {
    console.log('❌ 권한 없음: 사용자 정보나 역할이 없음');
    return false;
  }
  
  // 본사 관리자는 모든 이벤트 수정 가능
  if (user.role === '본사 관리자') {
    console.log('✅ 권한 있음: 본사 관리자');
    return true;
  }
  
  // 가맹점 관리자는 자신의 지점 이벤트만 수정 가능
  if (user.role === '가맹점 관리자') {
    if (!event) {
      console.log('✅ 권한 있음: 새 이벤트 생성');
      return true; // 새 이벤트 생성은 가능
    }
    
    // 본사관리자가 작성한 공지/알림은 수정 불가
    if (event.type === 'notice' && (event.branchName === '전체' || event.branchName === '본사')) {
      console.log('❌ 권한 없음: 본사 공지는 수정 불가');
      return false;
    }
    
    // 자신이 작성한 이벤트는 수정 가능
    if (event.createdBy === user.uid) {
      console.log('✅ 권한 있음: 자신이 작성한 이벤트');
      return true;
    }
    
    // 자신의 지점에서 작성된 이벤트는 수정 가능 (직원스케줄, 지점공지 등)
    if (event.createdByBranch === user.franchise) {
      console.log('✅ 권한 있음: 자신의 지점에서 작성된 이벤트');
      return true;
    }
    
    // 기존 이벤트에 작성자 정보가 없는 경우, 지점 기반으로 권한 확인
    if (!event.createdBy && !event.createdByRole && !event.createdByBranch) {
      if (event.branchName === user.franchise) {
        console.log('✅ 권한 있음: 기존 이벤트 - 지점 기반 권한');
        return true;
      }
    }
    
    // 자신의 지점 이벤트만 수정 가능
    if (event.branchName === user.franchise) {
      console.log('✅ 권한 있음: 자신의 지점 이벤트');
      return true;
    }
    
    console.log('❌ 권한 없음: 조건에 맞지 않음');
    return false;
  }
  
  console.log('❌ 권한 없음: 가맹점 관리자가 아님');
  return false;
}

export function canDeleteCalendarEvent(user: User | null, event: CalendarEvent | null): boolean {
  console.log('🔍 권한 확인 - canDeleteCalendarEvent:', {
    user: user ? {
      uid: user.uid,
      role: user.role,
      franchise: user.franchise
    } : null,
    event: event ? {
      id: event.id,
      title: event.title,
      type: event.type,
      branchName: event.branchName,
      createdBy: event.createdBy,
      createdByRole: event.createdByRole,
      createdByBranch: event.createdByBranch,
      relatedId: event.relatedId
    } : null
  });

  if (!user || !user.role || !event) {
    console.log('❌ 삭제 권한 없음: 사용자, 역할 또는 이벤트가 없음');
    return false;
  }
  
  // 자동 생성된 이벤트는 삭제 불가
  if (event.relatedId) {
    console.log('❌ 삭제 권한 없음: 자동 생성된 이벤트');
    return false;
  }
  
  // 본사 관리자는 모든 이벤트 삭제 가능
  if (user.role === '본사 관리자') {
    console.log('✅ 삭제 권한 있음: 본사 관리자');
    return true;
  }
  
  // 가맹점 관리자는 자신의 지점 이벤트만 삭제 가능
  if (user.role === '가맹점 관리자') {
    // 본사관리자가 작성한 공지/알림은 삭제 불가
    if (event.type === 'notice' && (event.branchName === '전체' || event.branchName === '본사')) {
      console.log('❌ 삭제 권한 없음: 본사 공지는 삭제 불가');
      return false;
    }
    
    // 자신이 작성한 이벤트는 삭제 가능
    if (event.createdBy === user.uid) {
      console.log('✅ 삭제 권한 있음: 자신이 작성한 이벤트');
      return true;
    }
    
    // 자신의 지점에서 작성된 이벤트는 삭제 가능 (직원스케줄, 지점공지 등)
    if (event.createdByBranch === user.franchise) {
      console.log('✅ 삭제 권한 있음: 자신의 지점에서 작성된 이벤트');
      return true;
    }
    
    // 기존 이벤트에 작성자 정보가 없는 경우, 지점 기반으로 권한 확인
    if (!event.createdBy && !event.createdByRole && !event.createdByBranch) {
      if (event.branchName === user.franchise) {
        console.log('✅ 삭제 권한 있음: 기존 이벤트 - 지점 기반 권한');
        return true;
      }
    }
    
    // 자신의 지점 이벤트만 삭제 가능
    if (event.branchName === user.franchise) {
      console.log('✅ 삭제 권한 있음: 자신의 지점 이벤트');
      return true;
    }
    
    console.log('❌ 삭제 권한 없음: 조건에 맞지 않음');
    return false;
  }
  
  console.log('❌ 삭제 권한 없음: 가맹점 관리자가 아님');
  return false;
}
