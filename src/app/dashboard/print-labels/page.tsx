
import { Suspense } from 'react';
import { getItemData } from "@/lib/data-fetch";
import type { LabelItemData } from "./components/label-item";
import { PrintLayout } from "./components/print-layout";
import { Skeleton } from '@/components/ui/skeleton';

async function generateLabels(searchParams: { [key: string]: string | string[] | undefined }) {
  const idsParam = searchParams.ids;
  const ids = Array.isArray(idsParam) ? idsParam : (idsParam || "").split(',').filter(id => id);
  const type = searchParams.type as 'product' | 'material';
  const quantity = parseInt(searchParams.quantity as string) || 1;
  const startPosition = parseInt(searchParams.start as string) || 1;

  let itemsToPrint: LabelItemData[] = [];
  if (ids.length > 0) {
    const fetchedItems = await Promise.all(ids.map(id => getItemData(id, type)));
    itemsToPrint = fetchedItems.filter((item): item is LabelItemData => item !== null);
  }

  const finalLabels: (LabelItemData | null)[] = Array(24).fill(null);

  if (itemsToPrint.length > 0) {
      if (itemsToPrint.length === 1 && quantity > 1) {
        // Single item, multiple quantity
        const singleItem = itemsToPrint[0];
        let count = 0;
        for (let i = startPosition - 1; i < 24 && count < quantity; i++) {
            finalLabels[i] = singleItem;
            count++;
        }
      } else {
        // Multiple items, one quantity each
        let currentPos = startPosition -1;
        for(const item of itemsToPrint) {
            if(currentPos < 24) {
                finalLabels[currentPos] = item;
                currentPos++;
            }
        }
      }
  }

  return <PrintLayout labels={finalLabels} />;
}

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6"><Skeleton className="h-96 w-full" /></div>}>
      {await generateLabels(searchParams)}
    </Suspense>
  );
}
