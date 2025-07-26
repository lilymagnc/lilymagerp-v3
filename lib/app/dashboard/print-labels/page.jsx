import { Suspense } from 'react';
import { getItemData } from "@/lib/data-fetch";
import { PrintLayout } from "./components/print-layout";
import { Skeleton } from '@/components/ui/skeleton';
export default async function PrintLabelsPage({ searchParams }) {
    const type = searchParams.type;
    const startPosition = parseInt(searchParams.start) || 1;
    const itemsParam = searchParams.items;
    const idsParam = searchParams.ids;
    const quantity = parseInt(searchParams.quantity) || 1;
    let labelsToPrint = [];
    if (itemsParam) { // Multi-item with quantities (e.g., "P001:3,P002:5")
        const itemRequests = itemsParam.split(',').map(item => {
            const [id, quantity] = item.split(':');
            return { id, quantity: parseInt(quantity) || 1 };
        });
        const fetchedItems = await Promise.all(itemRequests.map(async (req) => {
            const itemData = await getItemData(req.id, type);
            return Object.assign(Object.assign({}, itemData), { quantity: req.quantity });
        }));
        fetchedItems.forEach(item => {
            if (item.id) {
                for (let i = 0; i < item.quantity; i++) {
                    labelsToPrint.push({ id: item.id, name: item.name });
                }
            }
        });
    }
    else if (idsParam) { // Single or multiple items, single quantity
        const ids = Array.isArray(idsParam) ? idsParam : idsParam.split(',').filter(id => id);
        if (ids.length > 0) {
            const fetchedItems = await Promise.all(ids.map(id => getItemData(id, type)));
            const validItems = fetchedItems.filter((item) => item !== null);
            if (validItems.length === 1 && quantity > 1) { // Single item, multiple quantity
                const singleItem = validItems[0];
                for (let i = 0; i < quantity; i++) {
                    labelsToPrint.push(singleItem);
                }
            }
            else { // Multiple items, one quantity each
                labelsToPrint.push(...validItems);
            }
        }
    }
    const finalLabels = Array(24).fill(null);
    if (labelsToPrint.length > 0) {
        let currentPos = startPosition - 1;
        for (const item of labelsToPrint) {
            if (currentPos < 24) {
                finalLabels[currentPos] = item;
                currentPos++;
            }
        }
    }
    return (<Suspense fallback={<div className="max-w-4xl mx-auto p-6"><Skeleton className="h-96 w-full"/></div>}>
            <PrintLayout labels={finalLabels}/>
        </Suspense>);
}
