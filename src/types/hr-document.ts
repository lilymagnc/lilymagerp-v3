export interface HRDocument {
  id: string;
  documentType: '휴직계' | '퇴직계';
  userId: string;
  userName: string;
  submissionDate: firebase.firestore.Timestamp;
  status: '처리중' | '승인' | '반려';
  contents?: {
    startDate?: firebase.firestore.Timestamp;
    endDate?: firebase.firestore.Timestamp;
    reason?: string;
  };
  fileUrl?: string;
  approverId?: string;
  approvedDate?: firebase.firestore.Timestamp;
}
