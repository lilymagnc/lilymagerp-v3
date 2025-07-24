
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export type StockHistory = {
  id: string;
  date: string;
  type: "in" | "out";
  itemType: "product" | "material";
  itemName: string;
  quantity: number;
  branch: string;
  operator: string;
};

interface HistoryTableProps {
  history: StockHistory[];
}

export function HistoryTable({ history }: HistoryTableProps) {
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
              <TableHead>수량</TableHead>
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
                    <Badge variant={item.type === 'in' ? 'secondary' : 'destructive'}>
                      {item.type === 'in' ? '입고' : '출고'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${item.type === 'in' ? 'text-blue-600' : 'text-red-600'}`}>
                    {item.type === 'in' ? '+' : '-'}{item.quantity}
                  </TableCell>
                  <TableCell>{item.operator}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
