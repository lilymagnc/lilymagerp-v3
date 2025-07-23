"use client";

import { PageHeader } from "@/components/page-header";

export default function MaterialsPage() {
  return (
    <div>
      <PageHeader
        title="자재 관리"
        description="자재 정보를 등록하고 재고를 관리합니다."
      />
      <div className="flex items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground">자재 관리 기능은 현재 개발 중입니다.</p>
      </div>
    </div>
  );
}
