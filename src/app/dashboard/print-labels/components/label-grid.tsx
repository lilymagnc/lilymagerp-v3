
"use client";

import { LabelItem as LabelItemType } from "@/lib/data-fetch";
import { LabelItem } from "./label-item";

interface LabelGridProps {
    items: LabelItemType[];
}

export function LabelGrid({ items }: LabelGridProps) {
  return (
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
        {items.map((item, index) => {
            if (!item.name) {
                // Render a simple div with a border for empty items
                return (
                    <div
                        key={`empty-${index}`}
                        className="border border-dashed border-gray-300"
                    />
                );
            }
            // Render the full LabelItem for items with data
            return (
                <LabelItem key={`${item.id}-${index}`} id={item.id} name={item.name} />
            );
        })}
    </div>
  );
}
