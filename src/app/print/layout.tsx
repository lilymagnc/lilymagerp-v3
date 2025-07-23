
import React from 'react';

// This layout is intentionally minimal.
// It will be wrapped by the root layout in src/app/layout.tsx
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
