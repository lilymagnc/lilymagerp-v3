
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { LabelGrid } from "./label-grid";
import { fetchItemsByIds, LabelItem } from '@/lib/data-fetch';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintLabelsClient({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const router = useRouter();
    const [items, setItems] = useState<LabelItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const type = searchParams.type === 'products' ? 'products' : 'materials';
        const ids = typeof searchParams.ids === 'string' ? searchParams.ids.split(',') : [];
        const copies = parseInt(searchParams.copies as string) || 1;
        const startPosition = parseInt(searchParams.start as string) || 1;

        async function loadItems() {
            setLoading(true);
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
            setItems(finalItems);
            setLoading(false);
        }

        if (searchParams.ids) {
            loadItems();
        } else {
            setLoading(false);
            setItems([]);
        }

    }, [searchParams]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div>
            <PageHeader
                title="라벨 인쇄"
                description="선택한 항목의 바코드 라벨을 인쇄합니다. (폼텍 24칸 라벨 기준)"
                className="no-print"
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        돌아가기
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄하기
                    </Button>
                </div>
            </PageHeader>
            <LabelGrid items={items} />
        </div>
    );
}
