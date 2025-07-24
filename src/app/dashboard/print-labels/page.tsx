
import { Suspense } from 'react';
import { PageHeader } from "@/components/page-header";
import { LabelGrid } from "./components/label-grid";
import { fetchItemsByIds, LabelItem } from '@/lib/data-fetch';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PrintLabelsClient } from './components/print-labels-client';

export default function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  return (
    <div className="max-w-6xl mx-auto">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrintLabelsClient searchParams={searchParams} />
        </Suspense>
    </div>
  );
}
