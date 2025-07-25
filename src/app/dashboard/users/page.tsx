
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import { UserTable } from "./components/user-table";
import { UserForm } from "./components/user-form";
import { useAuth } from "@/hooks/use-auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          사용자 추가
        </Button>
      </PageHeader>
      <UserTable users={users} />
      <UserForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
