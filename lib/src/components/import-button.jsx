"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { ImportDialog } from "./import-dialog";
export function ImportButton({ resourceName, onImport, children, ...props }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    return (<>
            <Button {...props} onClick={() => setIsDialogOpen(true)} size="sm">
                {children}
            </Button>
            <ImportDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} resourceName={resourceName} onImport={onImport}/>
        </>);
}
