
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BranchForm } from "./components/branch-form";

const initialBranches = [
  { id: "hq", name: "릴리맥 본사", type: "본사", address: "서울특별시 영등포구 국제금융로6길 33 1002호", phone: "010-3911-8206", account: "국민은행 810-21-0609-906" },
  { id: "gwanghwamun", name: "릴리맥 광화문점", type: "직영점", address: "서울시 중구 세종대로 136 서울파이낸스빌딩 B2", phone: "010-2385-9518 / 010-2285-9518", account: "국민은행 407501-01-213500 이상원 (릴리맥 광화문점)" },
  { id: "nceastpole", name: "릴리맥 NC이스트폴점", type: "직영점", address: "서울시 광진구 아차산로 402, G1층", phone: "010-2908-5459 / 010-2285-9518", account: "국민은행 400437-01-027411 이성원 (릴리맥NC이스트폴)" },
  { id: "yeouido1", name: "릴리맥 여의도점", type: "직영점", address: "서울시 영등포구 여의나루로50 The-K타워 B1", phone: "010-8241-9518 / 010-2285-9518", account: "국민은행 92285951847 이진경 (릴리맥)" },
  { id: "yeouido2", name: "릴리맥 여의도2호점", type: "직영점", address: "서울시 영등포구 국제금융로8길 31 SK증권빌딩 B1", phone: "010-7939-9518 / 010-2285-9518", account: "국민은행 400437-01-027255 이성원 (릴리맥여의도2호)" },
  { id: "flowerlab", name: "릴리맥플라워랩", type: "기타", address: "서울특별시 영등포구 국제금융로6길 33 1002호", phone: "010-3911-8206", account: "국민은행 810-21-0609-906" },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState(initialBranches);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const handleAdd = () => {
    setSelectedBranch(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (branch: any) => {
    setSelectedBranch(branch);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBranch(null);
  };
  
  const handleDelete = (branchId: string) => {
    // In a real app, you'd call an API to delete the branch.
    // Here, we're just filtering it out of the local state.
    setBranches(branches.filter(branch => branch.id !== branchId));
    console.log(`Branch ${branchId} deleted.`);
  };

  return (
    <div>
      <PageHeader
        title="지점 관리"
        description="본사 및 직영, 가맹점 정보를 관리합니다."
      >
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          지점 추가
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
            <CardTitle>지점 목록</CardTitle>
            <CardDescription>
                전체 지점 목록입니다. 직영점, 가맹점, 본사 정보를 확인할 수 있습니다.
            </CardDescription>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>지점명</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="hidden md:table-cell">주소</TableHead>
              <TableHead className="hidden sm:table-cell">연락처</TableHead>
              <TableHead>
                <span className="sr-only">작업</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell>
                  <Badge variant={branch.type === '본사' ? 'default' : branch.type === '직영점' ? 'secondary' : 'outline'}>
                    {branch.type}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{branch.address}</TableCell>
                <TableCell className="hidden sm:table-cell">{branch.phone}</TableCell>
                <TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(branch)}>수정</DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">삭제</DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. '{branch.name}' 지점 데이터가 서버에서 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(branch.id)}
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
      <BranchForm 
        isOpen={isFormOpen}
        onOpenChange={handleCloseForm}
        branch={selectedBranch}
      />
    </div>
  );
}
