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
    <html>
      <head>
        <title>주문서 인쇄</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
