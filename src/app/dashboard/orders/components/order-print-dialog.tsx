
"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
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
import { PrintableContent } from '../page';


interface OrderPrintDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    order: Order | null;
    branches: Branch[];
}

export function OrderPrintDialog({ isOpen, onOpenChange, order, branches }: OrderPrintDialogProps) {
    const printableComponentRef = useRef(null);

    const handlePrint = useReactToPrint({
      content: () => printableComponentRef.current,
    });

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>주문서 인쇄 미리보기</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto border rounded-md p-4">
                    <div ref={printableComponentRef}>
                        <PrintableContent order={order} branches={branches} />
                    </div>
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
