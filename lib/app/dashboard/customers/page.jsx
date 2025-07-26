"use client";
import { PageHeader } from "@/components/page-header";
export default function CustomersPage() {
    return (<div>
      <PageHeader title="고객 관리" description="고객 정보를 등록하고 관리합니다."/>
      <div className="flex items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground">고객 관리 기능은 현재 개발 중입니다.</p>
      </div>
    </div>);
}
