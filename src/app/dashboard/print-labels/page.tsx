
import { fetchItemsByIds, LabelItem } from '@/lib/data-fetch';
import { LabelGrid } from './components/label-grid';
import { Suspense } from 'react';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function PrintLabels({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const type = searchParams.type === 'products' ? 'products' : 'materials';
  const ids = typeof searchParams.ids === 'string' ? searchParams.ids.split(',') : [];
  const copies = parseInt(searchParams.copies as string) || 1;
  const startPosition = parseInt(searchParams.start as string) || 1;
  
  const fetchedItems = await fetchItemsByIds(type, ids);
  
  let itemsToPrint: LabelItem[] = [];
  if (fetchedItems.length === 1 && copies > 1) {
    const item = fetchedItems[0];
    for (let i = 0; i < copies; i++) {
      itemsToPrint.push(item);
    }
  } else {
    itemsToPrint = fetchedItems;
  }

  const emptyLabels = Array.from({ length: Math.max(0, startPosition - 1) }, (_, i) => ({ id: `empty-${i}`, name: '' }));
  const finalItems = [...emptyLabels, ...itemsToPrint];

  return <LabelGrid items={finalItems} />;
}


export default function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  // This is a bit of a workaround to allow a Link component to go back.
  // In a real app, you might use client-side state management or router history.
  const backUrl = searchParams.type === 'products' ? '/dashboard/products' : '/dashboard/materials';

  return (
    <div className="max-w-6xl mx-auto">
       <div className="no-print">
             <PageHeader
                title="라벨 인쇄"
                description="선택한 항목의 바코드 라벨을 인쇄합니다. (폼텍 24칸 라벨 기준)"
            >
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={backUrl}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    돌아가기
                  </Link>
                </Button>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    인쇄하기
                </Button>
              </div>
            </PageHeader>
        </div>
      <div className="printable-area p-[1.5mm]">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <PrintLabels searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
