
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, FileText, Receipt, FileSignature } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Partner } from "@/hooks/use-partners";

interface PartnerTableProps {
  partners: Partner[];
  onEdit: (partner: Partner) => void;
  onDelete: (id: string) => void;
}

export function PartnerTable({ partners, onEdit, onDelete }: PartnerTableProps) {
    
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>거래처명</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="hidden md:table-cell">사업자번호</TableHead>
              <TableHead className="hidden md:table-cell">담당자</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length > 0 ? (
              partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>
                    <Badge variant={partner.type === 'purchase' ? 'secondary' : 'default'}>
                      {partner.type === 'purchase' ? '매입처' : '매출처'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono">{partner.businessNumber}</TableCell>
                  <TableCell className="hidden md:table-cell">{partner.managerName}</TableCell>
                  <TableCell>{partner.contact}</TableCell>
                  <TableCell className="text-right">
                     <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">메뉴 토글</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEdit(partner)}>수정</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>문서 출력</DropdownMenuLabel>
                          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />거래명세서</DropdownMenuItem>
                          <DropdownMenuItem><Receipt className="mr-2 h-4 w-4" />영수증</DropdownMenuItem>
                          <DropdownMenuItem><FileSignature className="mr-2 h-4 w-4" />견적서</DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>삭제</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                           이 작업은 되돌릴 수 없습니다. '{partner.name}' 거래처 데이터가 서버에서 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => onDelete(partner.id)}
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  등록된 거래처가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
