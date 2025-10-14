'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HRFormDisplay } from "@/components/hr/HRFormDisplay";
import { PrintableHRForm } from "@/components/hr/PrintableHRForm";
import { createRoot } from "react-dom/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// We are defining the type partially here to avoid dependency issues
// In a real scenario, this would import HRDocument from '@/types/hr-document.ts'
interface HRDocument {
  id: string;
  documentType: string;
  userId: string;
  userName: string;
  submissionDate: { toDate: () => Date };
  status: '처리중' | '승인' | '반려';
  contents?: { startDate?: any; endDate?: any; reason?: string, department?: string, position?: string, name?: string, joinDate?: any, contact?: string, handover?: string };
  fileUrl?: string;
}

const HRManagementPage = () => {
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<HRDocument | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "hr_documents"), orderBy("submissionDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HRDocument));
      setDocuments(docsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewDetails = (doc: HRDocument) => {
    setSelectedDoc(doc);
    setIsDetailViewOpen(true);
  };

  const handlePrint = () => {
    if (!selectedDoc) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      const container = printWindow.document.createElement('div');
      printWindow.document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<PrintableHRForm document={selectedDoc} />);
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleStatusChange = async (id: string, status: '승인' | '반려') => {
    try {
      const docRef = doc(db, 'hr_documents', id);
      await updateDoc(docRef, { status });
      toast({ variant: 'success', title: '성공', description: `문서 상태가 '${status}'으로 변경되었습니다.` });
    } catch (error) {
      console.error("Status update error:", error);
      toast({ variant: 'destructive', title: '오류', description: '상태 변경 중 오류가 발생했습니다.' });
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case '승인': return <Badge variant="success">승인</Badge>;
      case '반려': return <Badge variant="destructive">반려</Badge>;
      default: return <Badge variant="secondary">처리중</Badge>;
    }
  }

  return (
    <div>
      <PageHeader
        title="인사 서류 관리"
        description="제출된 휴직 및 퇴직 신청서를 확인하고 관리합니다."
      />
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제출일</TableHead>
                  <TableHead>제출자</TableHead>
                  <TableHead>문서 종류</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.submissionDate.toDate().toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell>{doc.userName}</TableCell>
                    <TableCell>{doc.documentType}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(doc)}>
                        <Eye className="mr-2 h-4 w-4" /> 상세 보기
                      </Button>
                      {doc.status === '처리중' && (
                        <>
                          <Button variant="success" size="sm" onClick={() => handleStatusChange(doc.id, '승인')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> 승인
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleStatusChange(doc.id, '반려')}>
                            <XCircle className="mr-2 h-4 w-4" /> 반려
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedDoc && (
        <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedDoc.userName}님의 {selectedDoc.documentType}</DialogTitle>
              <DialogDescription>
                제출된 서류의 상세 내용입니다. 검토 후 승인 또는 반려 처리를 할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <HRFormDisplay document={selectedDoc} />
            <DialogFooter>
              <Button variant="outline" onClick={handlePrint}>인쇄</Button>
              <Button variant="outline" onClick={() => setIsDetailViewOpen(false)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HRManagementPage;
