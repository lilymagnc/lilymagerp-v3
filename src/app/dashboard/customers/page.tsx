
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomers, Customer } from "@/hooks/use-customers";
import { CustomerForm, CustomerFormValues } from "./components/customer-form";
import { CustomerTable } from "./components/customer-table";
import { CustomerDetails } from "./components/customer-details";
import { StatementDialog } from "./components/statement-dialog";
import { ImportButton } from "@/components/import-button";
import { FileUp } from "lucide-react";
import { useBranches } from "@/hooks/use-branches";


export default function CustomersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedGrade, setSelectedGrade] = useState("all");
    
    const { customers, loading, addCustomer, updateCustomer, deleteCustomer, bulkAddCustomers } = useCustomers();
    const { branches } = useBranches();
    
    const customerGrades = useMemo(() => [...new Set(customers.map(c => c.grade || "신규"))], [customers]);

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(customer => 
                (selectedBranch === "all" || customer.branch === selectedBranch) &&
                (selectedType === "all" || customer.type === selectedType) &&
                (selectedGrade === "all" || (customer.grade || "신규") === selectedGrade)
            )
            .filter(customer => 
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [customers, searchTerm, selectedBranch, selectedType, selectedGrade]);

    const handleAdd = () => {
        setSelectedCustomer(null);
        setIsFormOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailOpen(false); // Close detail view if open
        setIsFormOpen(true);
    };

    const handleDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailOpen(true);
    }

    const handleStatementPrint = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsStatementOpen(true);
    };

    const handleFormSubmit = async (data: CustomerFormValues) => {
        if (selectedCustomer?.id) {
            await updateCustomer(selectedCustomer.id, data);
        } else {
            await addCustomer(data);
        }
        setIsFormOpen(false);
        setSelectedCustomer(null);
    };

    const handleDelete = async (id: string) => {
        await deleteCustomer(id);
    };

    const handleImport = async (data: any[]) => {
      await bulkAddCustomers(data, selectedBranch);
    }

    return (
        <div>
            <PageHeader title="고객 관리" description="고객 정보를 등록하고 관리합니다.">
                <div className="flex items-center gap-2">
                    <ImportButton resourceName="고객" onImport={handleImport}>
                        <FileUp className="mr-2 h-4 w-4" />
                        엑셀로 가져오기
                    </ImportButton>
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        고객 추가
                    </Button>
                </div>
            </PageHeader>
            <Card className="mb-4">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="고객/회사명, 연락처 검색..."
                                className="w-full rounded-lg bg-background pl-8"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="담당 지점" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 지점</SelectItem>
                                {branches.filter(b => b.type !== '본사').map(branch => (
                                    <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="고객 유형" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 유형</SelectItem>
                                <SelectItem value="personal">개인</SelectItem>
                                <SelectItem value="company">기업</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="고객 등급" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 등급</SelectItem>
                                {customerGrades.map(grade => (
                                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                 <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <CustomerTable 
                    customers={filteredCustomers}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRowClick={handleDetails}
                    onStatementPrint={handleStatementPrint}
                />
            )}
            
            <CustomerForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleFormSubmit}
                customer={selectedCustomer}
            />

            <CustomerDetails
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                onEdit={() => selectedCustomer && handleEdit(selectedCustomer)}
                customer={selectedCustomer}
            />

            <StatementDialog
                isOpen={isStatementOpen}
                onOpenChange={setIsStatementOpen}
                customer={selectedCustomer}
            />
        </div>
    );
}
