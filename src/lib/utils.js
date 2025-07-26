import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function downloadXLSX(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}
