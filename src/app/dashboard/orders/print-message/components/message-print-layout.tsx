
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
  messageFont: string;
  messageFontSize: number;
  senderFont: string;
  senderFontSize: number;
  messageContent: string;
  senderName: string;
}

const labelConfigs: Record<string, { cells: number; gridCols: string; height: string, className?: string }> = {
    'formtec-3107': { cells: 6, gridCols: 'grid-cols-2', height: '99.1mm', className: 'gap-x-0' }, // 2x3
    'formtec-3108': { cells: 8, gridCols: 'grid-cols-2', height: '70mm', className: 'gap-x-[4.5mm]' }, // 2x4
    'formtec-3109': { cells: 12, gridCols: 'grid-cols-2', height: '67.7mm', className: 'gap-x-[2.5mm]' }, // 2x6
};

export function MessagePrintLayout({ 
  order, 
  labelType, 
  startPosition, 
  messageFont, 
  messageFontSize, 
  senderFont, 
  senderFontSize, 
  messageContent, 
  senderName 
}: MessagePrintLayoutProps) {
  const router = useRouter();
  const config = labelConfigs[labelType] || labelConfigs['formtec-3108'];
  const labels = Array(config.cells).fill(null);

  // 편집된 메시지 내용 또는 원본 메시지 사용
  let finalMessageContent = messageContent || order.message?.content || "";
  let finalSenderName = senderName || order.orderer.name || "";

  // 원본 메시지에서 보내는 사람 분리 (--- 구분자 사용)
  if (!messageContent && order.message?.content) {
    const messageParts = order.message.content.split('\n---\n');
    if (messageParts.length > 1) {
      finalMessageContent = messageParts[0];
      finalSenderName = messageParts[1];
    }
  }

  if (finalMessageContent) {
      if (startPosition - 1 < config.cells) {
          labels[startPosition - 1] = { content: finalMessageContent, senderName: finalSenderName };
      }
  }

  const messageFontStyle: React.CSSProperties = {
    fontFamily: messageFont,
    fontSize: `${messageFontSize}pt`,
  };

  const senderFontStyle: React.CSSProperties = {
    fontFamily: senderFont,
    fontSize: `${senderFontSize}pt`,
  };

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
              padding: 10mm 7.5mm; /* Adjust padding for message labels if different */
            }
          }
        `}</style>
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
      <div id="printable-area-wrapper" className="bg-white">
        <div 
          id="label-grid-container" 
          className={cn(
            "grid gap-y-0 h-full", 
            config.gridCols, 
            config.className
          )}
        >
          {labels.map((labelData, index) => (
            <div 
              key={index} 
              className="bg-white p-4 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 print:border-transparent relative"
              style={{ height: config.height }}
            >
              {labelData ? (
                <>
                  <div 
                    className="whitespace-pre-wrap flex-1 flex items-center justify-center"
                    style={messageFontStyle}
                  >
                    {labelData.content}
                  </div>
                  <div 
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                    style={senderFontStyle}
                  >
                    - {labelData.senderName} -
                  </div>
                </>
              ) : (
                <div className="text-gray-400">빈 라벨</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
