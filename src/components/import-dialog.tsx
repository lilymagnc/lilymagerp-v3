
"use client"

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
import { FileUp } from "lucide-react"

interface ImportDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    resourceName: string
}

export function ImportDialog({ isOpen, onOpenChange, resourceName }: ImportDialogProps) {
    const { toast } = useToast();

    const handleImport = () => {
        // In a real app, this would handle file parsing and submission.
        toast({
            title: "기능 구현 예정",
            description: "파일 업로드 및 데이터 처리 기능은 현재 개발 중입니다.",
        })
        onOpenChange(false);
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
            <Input id="file" type="file" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            <p className="text-xs text-muted-foreground">
                파일의 첫 번째 행은 헤더(id, name, price 등)여야 합니다.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" />
            가져오기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
