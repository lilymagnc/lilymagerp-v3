
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog"
import { useEffect } from "react"

const printOptionsSchema = z.object({
  copies: z.coerce.number().int().min(1, "인쇄 수량은 1 이상이어야 합니다."),
  startPosition: z.coerce.number().int().min(1, "시작 위치는 1 이상이어야 합니다.").max(24, "시작 위치는 24 이하여야 합니다."),
})

type PrintOptionsFormValues = z.infer<typeof printOptionsSchema>

interface PrintOptionsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (values: PrintOptionsFormValues) => void
  selectedCount: number
}

export function PrintOptionsDialog({ isOpen, onOpenChange, onSubmit, selectedCount }: PrintOptionsDialogProps) {
  const form = useForm<PrintOptionsFormValues>({
    resolver: zodResolver(printOptionsSchema),
    defaultValues: {
      copies: selectedCount > 1 ? selectedCount : 1,
      startPosition: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        copies: selectedCount > 1 ? selectedCount : 1,
        startPosition: 1,
      });
    }
  }, [isOpen, selectedCount, form]);

  const handleFormSubmit = (data: PrintOptionsFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  }
  
  const isSingleItemSelected = selectedCount === 1;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>라벨 인쇄 옵션</DialogTitle>
          <DialogDescription>인쇄할 라벨의 수량과 시작 위치를 지정해주세요.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="copies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>인쇄 수량</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      {...field}
                      disabled={!isSingleItemSelected} 
                    />
                  </FormControl>
                  {!isSingleItemSelected && (
                     <p className="text-xs text-muted-foreground">여러 항목 선택 시, 각 1장씩 총 {selectedCount}장이 인쇄됩니다.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작 위치 (1-24)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">사용하고 남은 라벨지의 다음 칸 번호를 입력하세요.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">취소</Button>
                </DialogClose>
                <Button type="submit">인쇄 페이지로 이동</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
