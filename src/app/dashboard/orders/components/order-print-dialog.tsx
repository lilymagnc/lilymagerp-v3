
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Printer } from 'lucide-react';
import type { Order } from '@/hooks/use-orders';
import type { Branch } from '@/hooks/use-branches';
import { useReactToPrint } from 'react-to-print';

interface OrderPrintDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    order: Order | null;
    branches: Branch[];
    printableRef: React.RefObject<HTMLDivElement>;
}


export function OrderPrintDialog({ isOpen, onOpenChange, order, branches, printableRef }: OrderPrintDialogProps) {
    if (!order) return null;

    const handlePrint = useReactToPrint({
      content: () => printableRef.current,
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>주문서 인쇄 미리보기</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto border rounded-md">
                   {/* This div is the scrollable container for the preview */}
                   {/* It is NOT the printable content itself. The printable content is in a hidden div in page.tsx */}
                   <div className="p-4 bg-white text-black font-sans text-xs max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: printableRef.current?.innerHTML || "" }} />
                </div>
                <DialogFooter className="sm:justify-between mt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            닫기
                        </Button>
                    </DialogClose>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
