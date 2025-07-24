
import { getItemData } from "@/lib/data-fetch";
import type { LabelItemData } from "./components/label-item";
import { PrintLayout } from "./components/print-layout";

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

  return <PrintLayout labels={finalLabels} />;
}
