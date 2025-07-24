
"use client"

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";
import { ImportDialog } from "./import-dialog";

interface ImportButtonProps extends ButtonProps {
    resourceName: string;
    onImport: (data: any[]) => Promise<void>;
}

export function ImportButton({ resourceName, onImport, ...props }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <Button {...props} onClick={() => setIsDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                가져오기
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
