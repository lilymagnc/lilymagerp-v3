
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
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEffect } from "react"
import type { Partner } from "@/hooks/use-partners"
import { Separator } from "@/components/ui/separator"

const partnerSchema = z.object({
  name: z.string().min(1, "거래처명을 입력해주세요."),
  type: z.enum(["purchase", "sales"]).default("sales"),
  businessNumber: z.string().optional(),
  ceoName: z.string().optional(),
  businessType: z.string().optional(),
  businessItem: z.string().optional(),
  address: z.string().optional(),
  managerName: z.string().optional(),
  contact: z.string().min(1, "연락처를 입력해주세요."),
  email: z.string().email("유효한 이메일을 입력해주세요.").optional().or(z.literal('')),
  memo: z.string().optional(),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>

interface PartnerFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: PartnerFormValues) => void
  partner?: Partner | null
}

const defaultValues: PartnerFormValues = {
  name: "",
  type: "sales",
  businessNumber: "",
  ceoName: "",
  businessType: "",
  businessItem: "",
  address: "",
  managerName: "",
  contact: "",
  email: "",
  memo: "",
}

export function PartnerForm({ isOpen, onOpenChange, onSubmit, partner }: PartnerFormProps) {
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      form.reset(partner || defaultValues);
    }
  }, [partner, form, isOpen]);
  
  const handleFormSubmit = (data: PartnerFormValues) => {
    onSubmit(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? "거래처 정보 수정" : "새 거래처 추가"}</DialogTitle>
          <DialogDescription>거래처의 상세 정보를 입력하고 관리합니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            
            <Separator />
            <p className="text-sm font-semibold">기본 정보</p>
            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>거래처명</FormLabel>
                    <FormControl>
                      <Input placeholder="꽃길 주식회사" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>거래처 유형</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="sales">매출처 (고객사)</SelectItem>
                        <SelectItem value="purchase">매입처 (공급사)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />
            <p className="text-sm font-semibold">사업자 정보 (세금계산서 발행용)</p>
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="businessNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>사업자등록번호</FormLabel>
                    <FormControl><Input placeholder="123-45-67890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="ceoName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>대표자명</FormLabel>
                    <FormControl><Input placeholder="홍길동" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
            </div>
             <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="businessType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>업태</FormLabel>
                    <FormControl><Input placeholder="소매업" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="businessItem" render={({ field }) => (
                  <FormItem>
                    <FormLabel>종목</FormLabel>
                    <FormControl><Input placeholder="전자상거래업" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
            </div>
             <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                    <FormLabel>사업장 주소</FormLabel>
                    <FormControl><Textarea placeholder="상세 주소 입력" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>

            <Separator className="my-6" />
            <p className="text-sm font-semibold">담당자 정보</p>
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="managerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당자명</FormLabel>
                    <FormControl><Input placeholder="김담당" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl><Input placeholder="010-1234-5678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
            </div>
             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>이메일 (계산서 발행용)</FormLabel>
                    <FormControl><Input type="email" placeholder="tax@example.com" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="memo" render={({ field }) => (
                <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl><Textarea placeholder="특이사항 기록" {...field} rows={3} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">취소</Button>
              </DialogClose>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
