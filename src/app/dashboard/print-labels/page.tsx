
import { fetchItemsByIds, LabelItem } from '@/lib/data-fetch';
import { LabelGrid } from './components/label-grid';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="max-w-6xl mx-auto">
      <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <PrintLabels searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
