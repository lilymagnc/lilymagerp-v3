
import { Suspense } from 'react';
import { PageHeader } from "@/components/page-header";
import { LabelGrid } from "./components/label-grid";
import { fetchItemsByIds, LabelItem } from '@/lib/data-fetch';
import { Loader2 } from 'lucide-react';

export default function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  return (
    <div className="max-w-6xl mx-auto">
        <PageHeader
            title="라벨 인쇄"
            description="선택한 항목의 바코드 라벨을 인쇄합니다. (폼텍 24칸 라벨 기준)"
            className="no-print"
        />
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <LabelGridWrapper searchParams={searchParams} />
        </Suspense>
    </div>
  );
}


async function LabelGridWrapper({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const type = searchParams.type === 'products' ? 'products' : 'materials';
    const ids = typeof searchParams.ids === 'string' ? searchParams.ids.split(',') : [];
    const copies = parseInt(searchParams.copies as string) || 1;
    const startPosition = parseInt(searchParams.start as string) || 1;
    
    // In a real app, you would fetch from a database.
    // We'll use mock data based on the provided IDs.
    const fetchedItems = ids.map(id => ({
      id,
      name: `${type === 'products' ? '상품' : '자재'} ${id}`,
    }));

    let itemsToPrint: LabelItem[] = [];
    if (fetchedItems.length === 1) {
      // If one item is selected, print it 'copies' times
      const item = fetchedItems[0];
      for (let i = 0; i < copies; i++) {
        itemsToPrint.push(item);
      }
    } else {
      // If multiple items are selected, print each one once, up to 'copies' total if specified, otherwise just once.
       itemsToPrint = fetchedItems.slice(0, copies > 1 ? copies : fetchedItems.length);
    }
    
    const emptyLabels = Array.from({ length: Math.max(0, startPosition - 1) }, (_, i) => ({ id: `empty-${i}`, name: '' }));
    const finalItems = [...emptyLabels, ...itemsToPrint];

    return <LabelGrid items={finalItems} />;
}
