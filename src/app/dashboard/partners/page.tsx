"use client";

import { PageHeader } from "@/components/page-header";

export default function PartnersPage() {
  return (
    <div>
      <PageHeader
        title="거래처 관리"
        description="매입처 및 고객사 정보를 등록하고 관리합니다."
      />
      <div className="flex items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground">거래처 관리 기능은 현재 개발 중입니다.</p>
      </div>
    </div>
  );
}
