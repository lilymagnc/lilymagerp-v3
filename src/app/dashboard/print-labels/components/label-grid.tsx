
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { LabelItem } from "./label-item";

interface Item {
    id: string;
    name: string;
}

interface LabelGridProps {
    items: Item[];
}

export function LabelGrid({ items }: LabelGridProps) {
  return (
    <div>
        <div className="flex justify-end mb-4 no-print">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                인쇄하기
            </Button>
        </div>
        <div className="printable-area p-[1.5mm]">
             <div 
                className="grid grid-cols-3 gap-x-[3.4mm] gap-y-0 border border-dashed"
                style={{
                    width: '210mm',
                    height: '297mm',
                    padding: '12.8mm 8.1mm',
                    boxSizing: 'border-box',
                    gridTemplateRows: 'repeat(8, 33.9mm)',
                }}
            >
                {items.map(item => (
                    <LabelItem key={item.id} id={item.id} name={item.name} />
                ))}
                 {/* Fill remaining cells to show the grid */}
                {Array.from({ length: Math.max(0, 24 - items.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center justify-center border border-dashed border-gray-300">
                        <span className="text-gray-400 text-xs">빈 라벨</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
