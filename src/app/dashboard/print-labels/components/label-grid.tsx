
"use client"

import { LabelItem, LabelItemData } from "./label-item";

interface LabelGridProps {
  items: (LabelItemData | null)[];
}

export function LabelGrid({ items }: LabelGridProps) {
  return (
    <div className="grid grid-cols-3 gap-x-1 gap-y-[1.5px] bg-gray-200 p-[1px]">
      {items.map((item, index) =>
        item ? (
          <LabelItem key={index} item={item} />
        ) : (
          <div key={index} className="bg-white h-[135px] border border-dashed border-gray-300"></div>
        )
      )}
    </div>
  );
}
