"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

interface BackupRecord {
  id: string;
  timestamp: any;
  type: 'auto' | 'manual';
  createdBy?: string;
  status: 'completed' | 'failed';
  dataSize?: number;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isHQManager } = useUserRole();

  const functions = getFunctions();

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    // 본사 관리자가 아니면 백업 목록을 로드하지 않음
    if (!isHQManager()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const backupsQuery = query(
        collection(db, 'backups'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(backupsQuery);
      
      const backupsData: BackupRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        backupsData.push({
          id: doc.id,
          timestamp: data.timestamp,
          type: data.type,
          createdBy: data.createdBy,
          status: data.status,
          dataSize: data.data ? JSON.stringify(data.data).length : 0
        });
      });
      
      setBackups(backupsData);
    } catch (error) {
      console.error('백업 목록 로드 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '백업 목록을 불러오는 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    try {
      setCreatingBackup(true);
      const manualBackup = httpsCallable(functions, 'manualBackup');
      const result = await manualBackup();
      
      toast({
        title: '성공',
        description: '수동 백업이 완료되었습니다.'
      });
      
      loadBackups(); // 목록 새로고침
    } catch (error) {
      console.error('수동 백업 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '백업 생성 중 오류가 발생했습니다.'
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      setRestoringBackup(backupId);
      const restoreBackupFunction = httpsCallable(functions, 'restoreBackup');
      await restoreBackupFunction({ backupId });
      
      toast({
        title: '성공',
        description: '백업 복원이 완료되었습니다.'
      });
    } catch (error) {
      console.error('백업 복원 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '백업 복원 중 오류가 발생했습니다.'
      });
    } finally {
      setRestoringBackup(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '알 수 없음';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 본사 관리자가 아니면 접근 제한
  if (!isHQManager()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-500">백업 관리는 본사 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>백업 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="백업 관리"
        description="시스템 데이터의 백업을 관리하고 복원할 수 있습니다."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 백업 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              백업 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>전체 백업 수:</span>
                <span className="font-semibold">{backups.length}개</span>
              </div>
              <div className="flex justify-between">
                <span>자동 백업:</span>
                <span className="font-semibold">
                  {backups.filter(b => b.type === 'auto').length}개
                </span>
              </div>
              <div className="flex justify-between">
                <span>수동 백업:</span>
                <span className="font-semibold">
                  {backups.filter(b => b.type === 'manual').length}개
                </span>
              </div>
              <div className="flex justify-between">
                <span>최근 백업:</span>
                <span className="font-semibold">
                  {backups.length > 0 ? formatDate(backups[0].timestamp) : '없음'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 백업 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              백업 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                자동 백업은 매일 새벽 2시에 실행됩니다.
              </p>
              <p className="text-sm text-gray-600">
                백업 데이터는 Firestore에 안전하게 저장됩니다.
              </p>
            </div>
            <Button 
              onClick={createManualBackup} 
              disabled={creatingBackup}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {creatingBackup ? '백업 생성 중...' : '수동 백업 생성'}
            </Button>
          </CardContent>
        </Card>

        {/* 백업 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              백업 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• 백업 데이터는 Firestore에 저장됩니다</p>
              <p>• 자동 백업은 매일 새벽 2시에 실행됩니다</p>
              <p>• 백업 복원 시 기존 데이터가 덮어쓰기됩니다</p>
              <p>• 백업 데이터는 30일간 보관됩니다</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 백업 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            백업 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">백업이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {backup.type === 'auto' ? (
                        <Clock className="h-4 w-4 text-blue-500" />
                      ) : (
                        <User className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">
                        {backup.type === 'auto' ? '자동 백업' : '수동 백업'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(backup.timestamp)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {backup.dataSize ? formatFileSize(backup.dataSize) : '크기 정보 없음'}
                    </div>
                    <div className="flex items-center gap-1">
                      {backup.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {backup.status === 'completed' ? '완료' : '실패'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackup(backup.id)}
                      disabled={restoringBackup === backup.id || backup.status !== 'completed'}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {restoringBackup === backup.id ? '복원 중...' : '복원'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 