"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { useProducts } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
const stockUpdateSchema = z.object({
    stock: z.coerce.number().int().min(0, "재고는 0 이상이어야 합니다."),
});
export function StockUpdateForm({ isOpen, onOpenChange, product }) {
    const { manualUpdateStock } = useProducts();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm({
        resolver: zodResolver(stockUpdateSchema),
        defaultValues: {
            stock: (product === null || product === void 0 ? void 0 : product.stock) || 0,
        },
    });
    const onSubmit = async (data) => {
        if (!product || !user) {
            toast({
                variant: "destructive",
                title: "오류",
                description: "상품 또는 사용자 정보가 없어 업데이트할 수 없습니다.",
            });
            return;
        }
        setIsSubmitting(true);
        await manualUpdateStock(product.id, product.name, data.stock, product.branch, user.email || "Unknown User");
        setIsSubmitting(false);
        onOpenChange(false);
    };
    return (<Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>재고 업데이트</DialogTitle>
          <DialogDescription>'{product === null || product === void 0 ? void 0 : product.name}'의 현재 재고 수량을 업데이트합니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            <FormField control={form.control} name="stock" render={({ field }) => (<FormItem>
                  <FormLabel>변경할 재고</FormLabel>
                  <FormControl>
                    <Input type="number" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>취소</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    업데이트
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>);
}
