
import { Suspense } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { PrintLabelsClient } from './components/print-labels-client';

export default function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="max-w-6xl mx-auto">
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <PrintLabelsClient searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
