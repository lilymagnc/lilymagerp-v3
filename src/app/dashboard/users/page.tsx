
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Users } from "lucide-react";
import { UserTable } from "./components/user-table";
import { UserForm } from "./components/user-form";
import { useAuth } from "@/hooks/use-auth";
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface SystemUser {
  id: string; // email is the id
  email: string;
  role: string;
  franchise: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemUser));
        setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleBulkAddToEmployees = async () => {
    try {
      let addedCount = 0;
      let skippedCount = 0;
      
      for (const user of users) {
        // 이미 직원으로 등록되어 있는지 확인
        const employeeQuery = query(
          collection(db, "employees"),
          where("email", "==", user.email)
        );
        const existingEmployee = await getDocs(employeeQuery);
        
        if (existingEmployee.empty) {
          // 직원 정보 생성
          const employeeData = {
            name: user.email.split('@')[0],
            email: user.email,
            position: user.role === '본사 관리자' ? '관리자' : user.role === '가맹점 관리자' ? '점장' : '직원',
            department: user.franchise,
            contact: '',
            hireDate: new Date(),
            birthDate: new Date(),
            address: '',
            createdAt: serverTimestamp(),
          };

          await addDoc(collection(db, 'employees'), employeeData);
          addedCount++;
        } else {
          skippedCount++;
        }
      }
      
      toast({
        title: "일괄 등록 완료",
        description: `${addedCount}명이 직원으로 등록되었습니다. ${skippedCount}명은 이미 등록되어 있어 건너뛰었습니다.`
      });
    } catch (error) {
      console.error("Error bulk adding users to employees:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "일괄 등록 중 오류가 발생했습니다."
      });
    }
  };

  if (currentUser?.role !== '본사 관리자') {
    return (
      <div className="flex items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground">이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="사용자 관리"
        description="시스템 사용자 계정과 권한을 관리하세요."
      >
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                모든 사용자를 직원으로 등록
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>모든 사용자를 직원으로 등록하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  현재 등록된 모든 사용자를 인사관리 시스템에 직원으로 등록합니다. 이미 등록된 사용자는 건너뜁니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkAddToEmployees}>등록</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
        </div>
      </PageHeader>
      <UserTable users={users} />
      <UserForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
