
"use client";

import { useEffect, useState, useMemo } from 'react';
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

    const processedItems = useMemo(() => {
        const copies = parseInt(searchParams.copies as string) || 1;
        const startPosition = parseInt(searchParams.start as string) || 1;

        let itemsToPrint: LabelItem[] = [];
        if (items.length > 0) {
            // If only one item is selected, duplicate it by the number of copies.
            if (items.length === 1 && copies > 1) {
                const item = items[0];
                for (let i = 0; i < copies; i++) {
                    itemsToPrint.push(item);
                }
            } else { // Otherwise, print each selected item once.
                itemsToPrint = items;
            }
        }
        
        // Add empty items to the beginning of the array to offset the start position.
        const emptyLabels = Array.from({ length: Math.max(0, startPosition - 1) }, (_, i) => ({ id: `empty-${i}`, name: '' }));
        return [...emptyLabels, ...itemsToPrint];

    }, [items, searchParams.copies, searchParams.start]);


    useEffect(() => {
        const type = searchParams.type === 'products' ? 'products' : 'materials';
        const ids = typeof searchParams.ids === 'string' ? searchParams.ids.split(',') : [];

        async function loadItems() {
            if (ids.length === 0) {
                setItems([]);
                setLoading(false);
                return;
            }
            
            setLoading(true);
            const fetchedItems = await fetchItemsByIds(type, ids);
            setItems(fetchedItems);
            setLoading(false);
        }

        loadItems();

    }, [searchParams.ids, searchParams.type]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">라벨 데이터를 불러오는 중입니다...</p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="no-print">
                <PageHeader
                    title="라벨 인쇄"
                    description="선택한 항목의 바코드 라벨을 인쇄합니다. (폼텍 24칸 라벨 기준)"
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
            </div>
            <div className="printable-area">
                <LabelGrid items={processedItems} />
            </div>
        </div>
    );
}
