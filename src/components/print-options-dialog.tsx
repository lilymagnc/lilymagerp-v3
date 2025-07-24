
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
import { Printer } from "lucide-react"

const printOptionsSchema = z.object({
  quantity: z.coerce.number().int().min(1, "1 이상의 값을 입력해주세요.").max(24, "최대 24개까지 가능합니다."),
  startPosition: z.coerce.number().int().min(1, "1~24 사이의 값을 입력해주세요.").max(24, "1~24 사이의 값을 입력해주세요."),
})

type PrintOptionsFormValues = z.infer<typeof printOptionsSchema>

interface PrintOptionsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: PrintOptionsFormValues) => void
  itemName: string
}

export function PrintOptionsDialog({ isOpen, onOpenChange, onSubmit, itemName }: PrintOptionsDialogProps) {
  const form = useForm<PrintOptionsFormValues>({
    resolver: zodResolver(printOptionsSchema),
    defaultValues: {
      quantity: 1,
      startPosition: 1,
    },
  })
  
  const handleFormSubmit = (data: PrintOptionsFormValues) => {
    onSubmit(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>라벨 인쇄 옵션</DialogTitle>
          <DialogDescription>'{itemName}' 라벨의 인쇄 수량과 시작 위치를 지정하세요.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>인쇄 수량</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
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
                   <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">취소</Button>
                </DialogClose>
                <Button type="submit">
                  <Printer className="mr-2 h-4 w-4" /> 미리보기
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
