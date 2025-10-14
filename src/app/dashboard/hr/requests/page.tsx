'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const HRRequestsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({ variant: "destructive", title: "오류", description: "로그인이 필요합니다." });
      return;
    }
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    const documentType = file.name.includes('휴직') ? '휴직계' : '퇴직계';
    setUploading(true);

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `hr_submissions/${user.uid}/${Date.now()}_${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'hr_documents'), {
        userId: user.uid,
        userName: user.displayName || 'Unknown User',
        documentType: documentType,
        submissionDate: serverTimestamp(),
        status: '처리중',
        fileUrl: downloadURL,
      });

      toast({ variant: "success", title: "성공", description: `${documentType} 파일이 성공적으로 제출되었습니다.` });
      router.push('/dashboard/hr/requests'); // Refresh the page to show new status if needed
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: "destructive", title: "오류", description: "파일 제출 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  }, [user, router, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>사용자 정보를 불러오는 중...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">인사 서류 신청</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 1. 온라인으로 작성하기 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">온라인으로 작성하기</h2>
            <p>웹사이트에서 직접 휴직 또는 퇴직 신청서를 작성하고 제출합니다.</p>
            <div className="card-actions justify-end">
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/dashboard/hr/requests/new')}
              >
                작성하기
              </button>
            </div>
          </div>
        </div>

        {/* 2. 템플릿 다운로드 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">템플릿 다운로드</h2>
            <p>Word 또는 Excel 형식의 신청서 템플릿을 다운로드하여 직접 작성할 수 있습니다.</p>
            <div className="card-actions justify-end">
              <a href="/templates/휴직신청서.docx" download className="btn btn-secondary">Word</a>
              <a href="/templates/퇴직신청서.xlsx" download className="btn btn-secondary">Excel</a>
            </div>
          </div>
        </div>

        {/* 3. 작성된 파일 업로드 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">작성된 파일 업로드</h2>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <p>업로드 중...</p>
              ) : (
                isDragActive ?
                  <p>파일을 여기에 놓으세요...</p> :
                  <p>작성된 신청서 파일을 드래그 앤 드롭하거나 클릭하여 선택하세요.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRRequestsPage;