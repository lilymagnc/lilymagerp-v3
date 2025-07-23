
import React from 'react';

// This layout applies only to the print route group.
// It should NOT contain <html>, <head>, or <body> tags.
// This structure ensures that the print-specific styles and scripts are isolated
// without creating HTML validation errors.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        body {
          margin: 0 !important;
          background-color: #fff !important;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      {children}
    </>
  );
}
