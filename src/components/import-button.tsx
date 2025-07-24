
"use client"

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import { ImportDialog } from "./import-dialog";

interface ImportButtonProps extends ButtonProps {
    resourceName: string;
    onImport: (data: any[]) => Promise<void>;
    children?: React.ReactNode;
}

export function ImportButton({ resourceName, onImport, children, ...props }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const defaultContent = (
      <>
        <Upload className="mr-2 h-4 w-4" />
        가져오기
      </>
    );

    return (
        <>
            <Button {...props} onClick={() => setIsDialogOpen(true)}>
                {children || defaultContent}
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
