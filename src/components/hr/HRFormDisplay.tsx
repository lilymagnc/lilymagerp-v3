'use client';

import React from 'react';

// This is a simplified interface for display purposes
interface HRDocument {
  documentType: string;
  userName: string;
  submissionDate: { toDate: () => Date };
  contents?: {
    department?: string;
    position?: string;
    name?: string;
    joinDate?: any;
    startDate?: any;
    endDate?: any;
    reason?: string;
    contact?: string;
    handover?: string;
  };
}

interface HRFormDisplayProps {
  document: HRDocument | null;
}

export const HRFormDisplay: React.FC<HRFormDisplayProps> = ({ document }) => {
  if (!document) return null;

  const { documentType, userName, submissionDate, contents = {} } = document;
  const today = submissionDate.toDate().toLocaleDateString('ko-KR');

  return (
    <div className="p-8 bg-white rounded-lg">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">{documentType}</h1>
      </div>

      {/* 인적사항 */}
      <div className="border-t border-b py-4">
        <h3 className="text-lg font-semibold mb-4">신청인 정보</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>소속:</strong> {contents.department || '-'}</p>
          <p><strong>직위:</strong> {contents.position || '-'}</p>
          <p><strong>성명:</strong> {contents.name || userName}</p>
          {documentType === '퇴직원' && 
            <p><strong>입사일:</strong> {contents.joinDate ? contents.joinDate.toDate().toLocaleDateString('ko-KR') : '-'}</p>
          }
        </div>
      </div>

      {/* 신청 내용 */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">{documentType === '휴직원' ? '휴직' : '사직'} 신청 내용</h3>
        <div className="p-4 border rounded-md bg-gray-50 text-sm space-y-2">
          {documentType === '휴직원' ? (
            <>
              <p><strong>휴직 기간:</strong> 
                {contents.startDate ? contents.startDate.toDate().toLocaleDateString('ko-KR') : ''} ~ 
                {contents.endDate ? contents.endDate.toDate().toLocaleDateString('ko-KR') : ''}
              </p>
              <p><strong>사유:</strong> {contents.reason || '-'}</p>
              <p><strong>휴직 중 비상연락처:</strong> {contents.contact || '-'}</p>
              <p><strong>업무 인수인계자:</strong> {contents.handover || '-'}</p>
            </>
          ) : (
            <>
              <p><strong>퇴직 예정일:</strong> {contents.endDate ? contents.endDate.toDate().toLocaleDateString('ko-KR') : '-'}</p>
              <p><strong>사유:</strong> {contents.reason || '-'}</p>
            </>
          )}
        </div>
      </div>

      {/* 최종 제출 */}
      <div className="text-center pt-12">
        <p className="mb-4">위와 같이 {documentType === '휴직원' ? '휴직' : '사직'}하고자 하오니 허가하여 주시기 바랍니다.</p>
        <p className="mb-8">{today}</p>
        <p className="mb-10">신청인: {contents.name || userName} (인)</p>
      </div>
    </div>
  );
};
