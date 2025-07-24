
"use client"

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { ImportDialog } from "./import-dialog";

interface ImportButtonProps {
    resourceName: string;
}

export function ImportButton({ resourceName }: ImportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                시트에서 가져오기
            </Button>
            <ImportDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                resourceName={resourceName}
            />
        </>
    )
}
