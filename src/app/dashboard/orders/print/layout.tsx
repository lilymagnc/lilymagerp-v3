
import React from 'react';

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <style>
          {`
            @media print {
              @page {
                size: auto;
                margin: 0;
              }
              body {
                margin: 1cm;
              }
            }
          `}
        </style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
