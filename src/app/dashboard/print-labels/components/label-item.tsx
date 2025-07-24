
"use client";

import { Barcode } from "@/components/barcode";

interface LabelItemProps {
  id: string;
  name: string;
}

export function LabelItem({ id, name }: LabelItemProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-gray-400 p-1">
      <p 
        className="text-center text-[8pt] font-bold leading-tight"
        style={{
            height: '2.8em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
        }}
      >
        {name}
      </p>
      <div className="w-full">
         <Barcode 
            value={id}
            options={{
                format: 'CODE39',
                width: 1.5,
                height: 40,
                displayValue: true,
                fontSize: 12,
                margin: 2,
            }}
        />
      </div>
    </div>
  );
}
