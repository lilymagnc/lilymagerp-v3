
"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Printer } from "lucide-react";
import { LabelGrid } from "./label-grid";
import type { LabelItemData } from "./label-item";

interface PrintLayoutProps {
  labels: (LabelItemData | null)[];
}

export function PrintLayout({ labels }: PrintLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto">
       <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            #printable-area-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              height: 297mm;
              box-sizing: border-box;
              padding: 13.5mm 6.5mm;
            }
          }
        `}</style>
      <div className="no-print">
        <PageHeader
          title="라벨 인쇄 미리보기"
          description="인쇄 버튼을 눌러 라벨을 출력하세요. (용지: 폼텍 3108)"
        >
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            인쇄하기
          </Button>
        </PageHeader>
      </div>
      <div id="printable-area-wrapper" className="bg-white">
        <LabelGrid items={labels} />
      </div>
    </div>
  );
}
