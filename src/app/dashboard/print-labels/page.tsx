
import { Suspense } from 'react';
import { getItemData } from "@/lib/data-fetch";
import type { LabelItemData } from "./components/label-item";
import { PrintLayout } from "./components/print-layout";
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function generateLabels({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined }}) {
  const type = searchParams.type as 'product' | 'material';
  const startPosition = parseInt(searchParams.start as string) || 1;
  
  const itemsParam = searchParams.items as string;
  const idsParam = searchParams.ids as string;
  const quantity = parseInt(searchParams.quantity as string) || 1;
  
  let labelsToPrint: LabelItemData[] = [];

  if (itemsParam) { // Multi-item with quantities (e.g., "P001:3,P002:5")
    const itemRequests = itemsParam.split(',').map(item => {
      const [id, quantity] = item.split(':');
      return { id, quantity: parseInt(quantity) || 1 };
    });

    const fetchedItems = await Promise.all(itemRequests.map(async req => {
        const itemData = await getItemData(req.id, type);
        return { ...itemData, quantity: req.quantity } as LabelItemData & { quantity: number };
    }));

    fetchedItems.forEach(item => {
        if(item.id) {
            for (let i = 0; i < item.quantity; i++) {
                labelsToPrint.push({ id: item.id, name: item.name });
            }
        }
    });

  } else if (idsParam) { // Single or multiple items, single quantity
    const ids = Array.isArray(idsParam) ? idsParam : idsParam.split(',').filter(id => id);
    if (ids.length > 0) {
        const fetchedItems = await Promise.all(ids.map(id => getItemData(id, type)));
        const validItems = fetchedItems.filter((item): item is LabelItemData => item !== null);

        if (validItems.length === 1 && quantity > 1) { // Single item, multiple quantity
            const singleItem = validItems[0];
            for (let i = 0; i < quantity; i++) {
                labelsToPrint.push(singleItem);
            }
        } else { // Multiple items, one quantity each
            labelsToPrint.push(...validItems);
        }
    }
  }

  const finalLabels: (LabelItemData | null)[] = Array(24).fill(null);
  
  if (labelsToPrint.length > 0) {
    let currentPos = startPosition - 1;
    for(const item of labelsToPrint) {
        if(currentPos < 24) {
            finalLabels[currentPos] = item;
            currentPos++;
        }
    }
  }

  return <PrintLayout labels={finalLabels} />;
}

export default async function PrintLabelsPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6"><Skeleton className="h-96 w-full" /></div>}>
      {await generateLabels(props)}
    </Suspense>
  );
}
