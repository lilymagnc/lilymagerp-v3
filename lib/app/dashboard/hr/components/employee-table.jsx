"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { EmployeeForm } from "./employee-form";
const mockEmployees = [
    { id: "EMP-001", name: "김대표", position: "대표", department: "본사", contact: "010-1111-1111", email: "ceo@ggotgil.com", hireDate: "2020-01-15", birthDate: "1980-01-01", address: "서울시 강남구 테헤란로 123" },
    { id: "EMP-002", name: "박관리", position: "점장", department: "강남점", contact: "010-2222-2222", email: "manager.gn@ggotgil.com", hireDate: "2021-03-10", birthDate: "1990-05-15", address: "서울시 강남구 강남대로 456" },
    { id: "EMP-003", name: "이직원", position: "직원", department: "강남점", contact: "010-3333-3333", email: "staff.gn@ggotgil.com", hireDate: "2022-05-20", birthDate: "1995-08-20", address: "서울시 서초구 서초대로 789" },
    { id: "EMP-004", name: "최매니저", position: "매니저", department: "홍대점", contact: "010-4444-4444", email: "manager.hd@ggotgil.com", hireDate: "2021-08-01", birthDate: "1992-11-30", address: "서울시 마포구 양화로 12" },
    { id: "EMP-005", name: "정스탭", position: "직원", department: "홍대점", contact: "010-5555-5555", email: "staff.hd@ggotgil.com", hireDate: "2023-02-12", birthDate: "1998-02-25", address: "서울시 마포구 홍익로 34" },
];
export function EmployeeTable({ openForm }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedEmployee(null);
    };
    return (<>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>직위</TableHead>
                <TableHead className="hidden md:table-cell">소속</TableHead>
                <TableHead className="hidden md:table-cell">이메일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>
                  <span className="sr-only">작업</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEmployees.map((employee) => (<TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.position}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{employee.department}</TableCell>
                  <TableCell className="hidden md:table-cell">{employee.email}</TableCell>
                  <TableCell>{employee.contact}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4"/>
                          <span className="sr-only">메뉴 토글</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(employee)}>수정</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">삭제</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EmployeeForm isOpen={isFormOpen} onOpenChange={handleCloseForm} employee={selectedEmployee}/>
    </>);
}
