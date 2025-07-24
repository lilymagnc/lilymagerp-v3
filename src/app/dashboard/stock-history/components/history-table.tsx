
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

export type StockHistory = {
  id: string;
  date: string;
  type: "in" | "out" | "manual_update";
  itemType: "product" | "material";
  itemName: string;
  quantity: number;
  fromStock?: number;
  toStock?: number;
  resultingStock: number;
  branch: string;
  operator: string;
};

interface HistoryTableProps {
  history: StockHistory[];
}

export function HistoryTable({ history }: HistoryTableProps) {
    const getTypeBadge = (type: StockHistory['type']) => {
        switch (type) {
            case 'in': return <Badge variant="secondary">입고</Badge>;
            case 'out': return <Badge variant="destructive">출고</Badge>;
            case 'manual_update': return <Badge variant="outline">수동 수정</Badge>;
            default: return <Badge>{type}</Badge>;
        }
    }

    const renderQuantity = (item: StockHistory) => {
        if (item.type === 'manual_update') {
            return (
                <div className="flex items-center gap-1 font-mono">
                    <span>{item.fromStock}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{item.toStock}</span>
                </div>
            );
        }
        return (
            <span className={`font-semibold ${item.type === 'in' ? 'text-blue-600' : 'text-red-600'}`}>
                {item.type === 'in' ? '+' : '-'}{item.quantity}
            </span>
        );
    }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead>지점</TableHead>
              <TableHead>상품/자재명</TableHead>
              <TableHead>품목</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>변경 수량</TableHead>
              <TableHead>처리 후 재고</TableHead>
              <TableHead>처리자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length > 0 ? (
              history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(new Date(item.date), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell>{item.branch}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.itemType === 'product' ? '상품' : '자재'}</Badge>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(item.type)}
                  </TableCell>
                  <TableCell>
                    {renderQuantity(item)}
                  </TableCell>
                  <TableCell>{item.resultingStock}</TableCell>
                  <TableCell>{item.operator}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  조회된 기록이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
