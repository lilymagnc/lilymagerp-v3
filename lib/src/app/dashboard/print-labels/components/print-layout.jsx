"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Printer } from "lucide-react";
import { LabelGrid } from "./label-grid";
export function PrintLayout({ labels }) {
    return (<div className="max-w-4xl mx-auto">
      <div className="no-print">
        <PageHeader title="라벨 인쇄 미리보기" description="인쇄 버튼을 눌러 라벨을 출력하세요. (용지: 폼텍 3108)">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4"/>
            인쇄하기
          </Button>
        </PageHeader>
      </div>
      <div id="printable-area" className="bg-white">
        <LabelGrid items={labels}/>
      </div>
    </div>);
}
