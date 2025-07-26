"use client";
import { LabelItem } from "./label-item";
export function LabelGrid({ items }) {
    return (<div id="label-grid-container" className="grid grid-cols-3 gap-x-[2.5mm] gap-y-0 h-full">
      {items.map((item, index) => item ? (<LabelItem key={index} item={item}/>) : (<div key={index} className="bg-transparent h-[33.8mm] border border-dashed border-gray-300"></div>))}
    </div>);
}
