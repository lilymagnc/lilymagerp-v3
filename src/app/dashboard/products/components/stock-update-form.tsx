
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

const stockUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0, "재고는 0 이상이어야 합니다."),
})

type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>

interface StockUpdateFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  product: { id: string; name: string; stock: number } | null
}

export function StockUpdateForm({ isOpen, onOpenChange, product }: StockUpdateFormProps) {
  const form = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      stock: product?.stock || 0,
    },
  })

  const onSubmit = (data: StockUpdateFormValues) => {
    console.log(`Updating stock for ${product?.name} to ${data.stock}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>재고 업데이트</DialogTitle>
          <DialogDescription>'{product?.name}'의 현재 재고 수량을 업데이트합니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>현재 재고</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">취소</Button>
                </DialogClose>
                <Button type="submit">업데이트</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
