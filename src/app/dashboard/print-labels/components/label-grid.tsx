
"use client";

import { LabelItem as LabelItemType } from "@/lib/data-fetch";
import { LabelItem } from "./label-item";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface LabelGridProps {
    items: LabelItemType[];
}

export function LabelGrid({ items }: LabelGridProps) {
  return (
    <div>
        <div className="no-print">
             <PageHeader
                title="라벨 인쇄"
                description="선택한 항목의 바코드 라벨을 인쇄합니다. (폼텍 24칸 라벨 기준)"
            >
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    인쇄하기
                </Button>
            </PageHeader>
        </div>
        <div className="printable-area p-[1.5mm]">
             <div 
                className="grid grid-cols-3 gap-x-[3.4mm] gap-y-0"
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '12.8mm 8.1mm',
                    boxSizing: 'border-box',
                    gridTemplateRows: 'repeat(8, 33.9mm)',
                }}
            >
                {items.map((item, index) => (
                   <LabelItem key={`${item.id}-${index}`} id={item.id} name={item.name} />
                ))}
            </div>
        </div>
    </div>
  );
}
