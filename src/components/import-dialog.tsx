
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

    const handleUpload = () => {
        // In a real app, this would handle file parsing and submission.
        toast({
            title: "기능 구현 예정",
            description: "파일 업로드 및 처리 기능은 현재 개발 중입니다.",
        })
        onOpenChange(false);
    }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{resourceName} 데이터 가져오기</DialogTitle>
          <DialogDescription>
            엑셀(XLSX) 또는 CSV 파일을 업로드하여 {resourceName} 데이터를 한 번에 추가하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="import-file">파일 선택</Label>
            <Input id="import-file" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
            <p className="text-xs text-muted-foreground">
                필요한 컬럼: [컬럼1], [컬럼2], [컬럼3]...
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleUpload}>
            <FileUp className="mr-2 h-4 w-4" />
            업로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
