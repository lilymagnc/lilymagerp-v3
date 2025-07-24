
"use client"

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import { ImportDialog } from "./import-dialog";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ImportButtonProps extends ButtonProps {
    resourceName: string;
    onImport: (data: any[]) => Promise<void>;
    children?: React.ReactNode;
    asDropdownMenuItem?: boolean;
}

export function ImportButton({ resourceName, onImport, children, asDropdownMenuItem, className, ...props }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const defaultContent = (
      <>
        <Upload className="mr-2 h-4 w-4" />
        가져오기
      </>
    );
    
    const triggerContent = children || defaultContent;

    if (asDropdownMenuItem) {
        return (
            <>
                 <DropdownMenuItem
                    className={cn("w-full cursor-pointer", className)}
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsDialogOpen(true);
                    }}
                >
                    {triggerContent}
                </DropdownMenuItem>
                <ImportDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    resourceName={resourceName}
                    onImport={onImport}
                />
            </>
        )
    }

    return (
        <>
            <Button {...props} onClick={() => setIsDialogOpen(true)}>
                {triggerContent}
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
