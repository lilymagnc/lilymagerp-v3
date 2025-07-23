
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { EmployeeTable } from "./components/employee-table";
import { EmployeeForm } from "./components/employee-form";

export default function HrPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="인사 관리"
        description="직원 정보를 등록하고 관리하세요."
      >
        <div className="flex items-center gap-2">
          <ImportButton resourceName="직원" />
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            직원 추가
          </Button>
        </div>
      </PageHeader>
      <EmployeeTable openForm={() => setIsFormOpen(true)} />
      <EmployeeForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
