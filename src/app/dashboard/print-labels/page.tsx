
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Printer } from "lucide-react";
import { LabelGrid } from "./components/label-grid";
import { getItemData } from "@/lib/data-fetch";
import type { LabelItemData } from "./components/label-item";

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const ids = Array.isArray(searchParams.ids) ? searchParams.ids : (searchParams.ids || "").split(',');
  const type = searchParams.type as 'product' | 'material';
  const quantity = parseInt(searchParams.quantity as string) || 1;
  const startPosition = parseInt(searchParams.start as string) || 1;

  let itemsToPrint: LabelItemData[] = [];
  if (ids.length > 0 && ids[0]) {
    const fetchedItems = await Promise.all(ids.map(id => getItemData(id, type)));
    itemsToPrint = fetchedItems.filter((item): item is LabelItemData => item !== null);
  }

  const finalLabels: (LabelItemData | null)[] = Array(24).fill(null);

  if (itemsToPrint.length > 0) {
    const singleItem = itemsToPrint[0]; // For now, we only handle one item
    let count = 0;
    for (let i = startPosition - 1; i < 24 && count < quantity; i++) {
        finalLabels[i] = singleItem;
        count++;
    }
  }


  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print">
         <PageHeader
            title="라벨 인쇄 미리보기"
            description="인쇄 버튼을 눌러 라벨을 출력하세요. (용지: 폼텍 3108)"
        >
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                인쇄하기
            </Button>
        </PageHeader>
      </div>
      <div id="printable-area" className="bg-white">
        <LabelGrid items={finalLabels} />
      </div>
    </div>
  );
}
