
import React from 'react';

// This layout applies only to the print route.
// It ensures that the print page doesn't inherit the main dashboard layout (sidebar, header, etc.)
// By providing its own <html> and <body>, it breaks away from the root layout.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <title>주문서 인쇄</title>
        <style>{`
          body {
            margin: 0;
            background-color: #fff;
          }
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
