
"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import { ImportDialog } from "./import-dialog";

interface ImportButtonProps extends Omit<ButtonProps, 'children'> {
    resourceName: string;
    onImport: (data: any[]) => Promise<void>;
    children: React.ReactNode;
}

export function ImportButton({ resourceName, onImport, children, ...props }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <Button {...props} onClick={() => setIsDialogOpen(true)} size="sm">
                {children}
            </Button>
            <ImportDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                resourceName={resourceName}
                onImport={onImport}
            />
        </>
    )
}
