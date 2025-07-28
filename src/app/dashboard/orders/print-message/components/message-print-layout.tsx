
"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { SerializableOrder } from '../page';
import { cn } from "@/lib/utils";

interface MessagePrintLayoutProps {
  order: SerializableOrder;
  labelType: string;
  startPosition: number;
  font: string;
  fontSize: number;
}

const labelConfigs: Record<string, { cells: number; gridCols: string; height: string, className?: string }> = {
    'formtec-3107': { cells: 6, gridCols: 'grid-cols-2', height: '99.1mm', className: 'gap-x-0' }, // 2x3
    'formtec-3108': { cells: 8, gridCols: 'grid-cols-2', height: '70mm', className: 'gap-x-[4.5mm]' }, // 2x4
    'formtec-3109': { cells: 12, gridCols: 'grid-cols-2', height: '67.7mm', className: 'gap-x-[2.5mm]' }, // 2x6
};

export function MessagePrintLayout({ order, labelType, startPosition, font, fontSize }: MessagePrintLayoutProps) {
  const router = useRouter();
  const config = labelConfigs[labelType] || labelConfigs['formtec-3108'];
  const labels = Array(config.cells).fill(null);

  if (order.message?.content) {
      if (startPosition - 1 < config.cells) {
          labels[startPosition - 1] = order.message.content;
      }
  }

  const fontStyle = {
    fontFamily: font,
    fontSize: `${fontSize}pt`,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print">
        <PageHeader
          title="메시지 인쇄 미리보기"
          description={`주문자: ${order.orderer.name} / 라벨지: ${labelType}`}
        >
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    뒤로가기
                </Button>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    인쇄하기
                </Button>
            </div>
        </PageHeader>
      </div>
      <div id="printable-area" className="bg-white">
        <div 
          id="label-grid-container" 
          className={cn(
            "grid gap-y-0 h-full", 
            config.gridCols, 
            config.className
          )}
        >
          {labels.map((content, index) => (
            <div 
              key={index} 
              className="bg-white p-4 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 print:border-none"
              style={{ height: config.height, ...fontStyle }}
            >
              <p className="whitespace-pre-wrap">
                {content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
