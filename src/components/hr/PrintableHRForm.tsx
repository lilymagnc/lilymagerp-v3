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

interface PrintableHRFormProps {
  document: HRDocument | null;
}

export const PrintableHRForm: React.FC<PrintableHRFormProps> = ({ document }) => {
  if (!document) return null;

  const { documentType, userName, submissionDate, contents = {} } = document;
  const today = submissionDate.toDate().toLocaleDateString('ko-KR');

  return (
    <html>
      <head>
        <title>{`${documentType} - ${userName}`}</title>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            font-family: 'Malgun Gothic', sans-serif;
            line-height: 1.6;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 2rem;
            letter-spacing: 0.5rem;
          }
          h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            border-bottom: 1px solid #ccc;
            padding-bottom: 0.5rem;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            font-size: 0.9rem;
          }
          .content-box {
            border: 1px solid #eee;
            background-color: #f9f9f9;
            padding: 1rem;
            border-radius: 0.375rem;
            font-size: 0.9rem;
          }
          .submission-section {
            text-align: center;
            padding-top: 3rem;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>{documentType}</h1>

          <div className="border-t border-b py-4">
            <h3>신청인 정보</h3>
            <div className="info-grid">
              <p><strong>소속:</strong> {contents.department || '-'}</p>
              <p><strong>직위:</strong> {contents.position || '-'}</p>
              <p><strong>성명:</strong> {contents.name || userName}</p>
              {documentType === '퇴직원' && 
                <p><strong>입사일:</strong> {contents.joinDate ? contents.joinDate.toDate().toLocaleDateString('ko-KR') : '-'}</p>
              }
            </div>
          </div>

          <div style={{marginTop: '2rem'}}>
            <h3>{documentType === '휴직원' ? '휴직' : '사직'} 신청 내용</h3>
            <div className="content-box">
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

          <div className="submission-section">
            <p style={{marginBottom: '1rem'}}>위와 같이 {documentType === '휴직원' ? '휴직' : '사직'}하고자 하오니 허가하여 주시기 바랍니다.</p>
            <p style={{marginBottom: '2rem'}}>{today}</p>
            <p>신청인: {contents.name || userName} (인)</p>
          </div>
        </div>
      </body>
    </html>
  );
};
