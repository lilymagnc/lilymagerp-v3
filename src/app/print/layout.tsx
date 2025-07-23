import React from 'react';

// This layout applies only to the print route.
// It ensures that the print page doesn't inherit the main dashboard layout (sidebar, header, etc.)
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
