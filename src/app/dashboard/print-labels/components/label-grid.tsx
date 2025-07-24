
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
                {items.map(item => (
                   item.name ? (
                     <LabelItem key={item.id} id={item.id} name={item.name} />
                   ) : (
                     <div key={item.id} className="border border-dashed border-gray-300" />
                   )
                ))}
            </div>
        </div>
    </div>
  );
}
