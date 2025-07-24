
"use client"

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { ImportDialog } from "./import-dialog";

interface ImportButtonProps {
    resourceName: string;
    onImport: (data: any[]) => Promise<void>;
}

export function ImportButton({ resourceName, onImport }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
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
