
"use client"

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import { ImportDialog } from "./import-dialog";
import { DropdownMenuItem } from "./ui/dropdown-menu";

interface ImportButtonProps extends ButtonProps {
    resourceName: string;
    onImport: (data: any[]) => Promise<void>;
    asDropdownMenuItem?: boolean;
    children: React.ReactNode;
}

export function ImportButton({ resourceName, onImport, asDropdownMenuItem = false, children, ...props }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const TriggerComponent = asDropdownMenuItem ? DropdownMenuItem : Button;

    return (
        <>
            <TriggerComponent {...props} onClick={() => setIsDialogOpen(true)} onSelect={(e) => e.preventDefault()}>
                {children}
            </TriggerComponent>
            <ImportDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                resourceName={resourceName}
                onImport={onImport}
            />
        </>
    )
}
