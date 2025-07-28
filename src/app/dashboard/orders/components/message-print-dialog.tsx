
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from "@/hooks/use-orders";

interface MessagePrintDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: { orderId: string, labelType: string, startPosition: number }) => void;
  order: Order;
}

const labelTypes = [
    { value: 'formtec-3107', label: '폼텍 3107 (6칸)', cells: 6, gridCols: 'grid-cols-2' },
    { value: 'formtec-3108', label: '폼텍 3108 (8칸)', cells: 8, gridCols: 'grid-cols-2' },
    { value: 'formtec-3109', label: '폼텍 3109 (12칸)', cells: 12, gridCols: 'grid-cols-3' },
];

export function MessagePrintDialog({ isOpen, onOpenChange, onSubmit, order }: MessagePrintDialogProps) {
  const [labelType, setLabelType] = useState(labelTypes[0].value);
  const [startPosition, setStartPosition] = useState(1);
  
  const selectedLabel = labelTypes.find(lt => lt.value === labelType) || labelTypes[0];

  const handleFormSubmit = () => {
    onSubmit({
        orderId: order.id,
        labelType,
        startPosition
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>메시지 인쇄 옵션</DialogTitle>
          <DialogDescription>
            '{order.orderer.name}'님의 메시지를 인쇄합니다. 라벨지와 시작 위치를 선택해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div>
                <Label>인쇄할 메시지</Label>
                <div className="mt-1 p-3 border rounded-md bg-muted text-sm whitespace-pre-wrap h-24 overflow-y-auto">
                    {order.message?.content || "메시지 내용이 없습니다."}
                </div>
            </div>
            <div>
                <Label htmlFor="label-type">라벨지 종류</Label>
                <Select value={labelType} onValueChange={(value) => { setLabelType(value); setStartPosition(1); }}>
                    <SelectTrigger id="label-type">
                        <SelectValue placeholder="라벨지 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {labelTypes.map(lt => (
                            <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="start-position">시작 위치 (1-{selectedLabel.cells})</Label>
                <div className={cn("grid gap-1 mt-2 border p-2 rounded-md", selectedLabel.gridCols)}>
                    {Array.from({ length: selectedLabel.cells }).map((_, i) => {
                        const position = i + 1;
                        return (
                        <Button
                            key={position}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn("h-8", startPosition === position && "bg-primary text-primary-foreground")}
                            onClick={() => setStartPosition(position)}
                        >
                            {position}
                        </Button>
                        );
                    })}
                </div>
            </div>
        </div>
        <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button type="button" variant="secondary">취소</Button>
            </DialogClose>
            <Button type="button" onClick={handleFormSubmit} disabled={!order.message?.content}>
              <Printer className="mr-2 h-4 w-4"/> 인쇄 미리보기
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
