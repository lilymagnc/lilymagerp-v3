import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadCSV(data: Record<string, any>[], filename: string) {
  const BOM = "\uFEFF"; // UTF-8 Byte Order Mark
  const csvRows: string[] = [];
  const headers = Object.keys(data[0]);

  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // If the value contains a comma, quote it
      if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = BOM + csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
