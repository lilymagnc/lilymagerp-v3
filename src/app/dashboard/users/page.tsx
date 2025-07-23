
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import { UserTable } from "./components/user-table";
import { UserForm } from "./components/user-form";

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      <UserTable />
      <UserForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
