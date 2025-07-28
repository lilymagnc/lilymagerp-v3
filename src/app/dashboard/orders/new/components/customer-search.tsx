
"use client";

import { useState, useCallback } from 'react';
import { useCustomers, Customer } from '@/hooks/use-customers';
import { debounce } from 'lodash';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';

interface CustomerSearchProps {
    onCustomerSelect: (customer: Customer) => void;
}

export function CustomerSearch({ onCustomerSelect }: CustomerSearchProps) {
    const { findCustomersByContact } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (search: string) => {
            if (search.length >= 3) {
                const customers = await findCustomersByContact(search);
                setResults(customers);
                setIsOpen(customers.length > 0);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300),
        [findCustomersByContact]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handleSelect = (customer: Customer) => {
        onCustomerSelect(customer);
        setIsOpen(false);
        setSearchTerm(customer.contact);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="orderer-contact">연락처</Label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Input
                        id="orderer-contact"
                        placeholder="010-1234-5678"
                        value={searchTerm}
                        onChange={handleChange}
                    />
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandList>
                            {results.length > 0 ? (
                                results.map(customer => (
                                    <CommandItem key={customer.id} onSelect={() => handleSelect(customer)}>
                                        {customer.name} ({customer.company || '개인'}) - {customer.contact}
                                    </CommandItem>
                                ))
                            ) : (
                                <div className="py-6 text-center text-sm">일치하는 고객이 없습니다.</div>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

