
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { UserForm } from "./user-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const mockUsers = [
  { id: "USER-001", email: "admin@ggotgil.com", role: "본사 관리자", franchise: "꽃길 본사", lastLogin: "2023-10-26 10:30" },
  { id: "USER-002", email: "manager_gn@example.com", role: "가맹점 관리자", franchise: "강남점", lastLogin: "2023-10-26 09:15" },
  { id: "USER-003", email: "staff_gn@example.com", role: "직원", franchise: "강남점", lastLogin: "2023-10-25 14:00" },
  { id: "USER-004", email: "manager_hd@example.com", role: "가맹점 관리자", franchise: "홍대점", lastLogin: "2023-10-26 11:05" },
];

export function UserTable() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>소속</TableHead>
                <TableHead className="hidden md:table-cell">마지막 로그인</TableHead>
                <TableHead>
                  <span className="sr-only">작업</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === '본사 관리자' ? 'default' : user.role === '가맹점 관리자' ? 'secondary' : 'outline'}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.franchise}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.lastLogin}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(user)}>권한 변경</DropdownMenuItem>
                          <DropdownMenuItem>비밀번호 초기화</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">계정 비활성화</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말로 계정을 비활성화하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 해당 사용자의 시스템 접근을 차단합니다. 데이터는 삭제되지 않습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90">비활성화</AlertDialogAction>
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
      {isFormOpen && <UserForm isOpen={isFormOpen} onOpenChange={handleCloseForm} user={selectedUser} />}
    </>
  );
}
