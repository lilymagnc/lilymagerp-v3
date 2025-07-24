
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FileUp, Loader2 } from "lucide-react"
import * as XLSX from "xlsx";

interface ImportDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    resourceName: string
    onImport: (data: any[]) => Promise<void>
}

export function ImportDialog({ isOpen, onOpenChange, resourceName, onImport }: ImportDialogProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    }

    const handleImportClick = async () => {
        if (!file) {
            toast({
                variant: "destructive",
                title: "파일 없음",
                description: "업로드할 파일을 선택해주세요.",
            });
            return;
        }

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    await onImport(json);

                    toast({
                        title: "가져오기 성공",
                        description: `${json.length}개의 ${resourceName} 데이터가 성공적으로 처리되었습니다.`,
                    });
                    onOpenChange(false);
                } catch (readError) {
                    console.error("File parsing error:", readError);
                    toast({
                        variant: "destructive",
                        title: "파일 분석 오류",
                        description: "파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.",
                    });
                } finally {
                     setFile(null);
                }
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error("File read initiation error:", error);
             toast({
                variant: "destructive",
                title: "오류",
                description: "파일을 읽기 시작하는 중 오류가 발생했습니다.",
            });
        } finally {
            // The actual isImporting=false will be set inside the onload callback
            // to ensure it waits for the async onImport to finish.
            // But we add a timeout here to prevent it from getting stuck forever.
            setTimeout(() => setIsImporting(false), 30000); 
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{resourceName} 데이터 가져오기</DialogTitle>
          <DialogDescription>
            Excel(XLSX) 파일을 업로드해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="file">파일 선택</Label>
            <Input id="file" type="file" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
                파일의 첫 번째 행은 헤더(id, name, price 등)여야 합니다.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>취소</Button>
          <Button onClick={handleImportClick} disabled={isImporting || !file}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            가져오기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
