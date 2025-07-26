"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
export function HistoryTable({ history }) {
    const getTypeBadge = (type) => {
        switch (type) {
            case 'in': return <Badge variant="secondary">입고</Badge>;
            case 'out': return <Badge variant="destructive">출고</Badge>;
            case 'manual_update': return <Badge variant="outline">수동 수정</Badge>;
            default: return <Badge>{type}</Badge>;
        }
    };
    const renderQuantity = (item) => {
        if (item.type === 'manual_update') {
            return (<div className="flex items-center gap-1 font-mono">
                    <span>{item.fromStock}</span>
                    <ArrowRight className="h-3 w-3"/>
                    <span>{item.toStock}</span>
                </div>);
        }
        return (<span className={`font-semibold ${item.type === 'in' ? 'text-blue-600' : 'text-red-600'}`}>
                {item.type === 'in' ? '+' : '-'}{item.quantity}
            </span>);
    };
    return (<Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead>지점</TableHead>
              <TableHead>상품/자재명</TableHead>
              <TableHead>공급업체</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">단가</TableHead>
              <TableHead className="text-right">총액</TableHead>
              <TableHead className="text-right">재고</TableHead>
              <TableHead>처리자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length > 0 ? (history.map((item) => (<TableRow key={item.id}>
                  <TableCell>{format(new Date(item.date), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell>{item.branch}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.supplier || "-"}</TableCell>
                  <TableCell>
                    {getTypeBadge(item.type)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderQuantity(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.price ? `₩${item.price.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.totalAmount ? `₩${item.totalAmount.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">{item.resultingStock}</TableCell>
                  <TableCell>{item.operator}</TableCell>
                </TableRow>))) : (<TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  조회된 기록이 없습니다.
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>);
}
