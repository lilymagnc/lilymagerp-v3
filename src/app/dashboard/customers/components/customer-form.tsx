
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
import { useBranches } from "@/hooks/use-branches"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

const customerSchema = z.object({
  name: z.string().min(1, "고객명을 입력해주세요."),
  type: z.enum(["personal", "company"]).default("personal"),
  company: z.string().optional(),
  contact: z.string().min(1, "연락처를 입력해주세요."),
  email: z.string().email("유효한 이메일을 입력해주세요.").optional().or(z.literal('')),
  branch: z.string().min(1, "담당 지점을 선택해주세요."),
  grade: z.string().optional(),
  tags: z.string().optional(),
  birthday: z.date().optional().nullable(),
  anniversary: z.date().optional().nullable(),
  memo: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: CustomerFormValues) => void
  customer?: any
}

const defaultValues: CustomerFormValues = {
  name: "",
  type: "personal",
  company: "",
  contact: "",
  email: "",
  branch: "",
  grade: "신규",
  tags: "",
  birthday: null,
  anniversary: null,
  memo: "",
}

export function CustomerForm({ isOpen, onOpenChange, onSubmit, customer }: CustomerFormProps) {
  const { branches } = useBranches()
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        form.reset({
          ...customer,
          birthday: customer.birthday ? new Date(customer.birthday) : null,
          anniversary: customer.anniversary ? new Date(customer.anniversary) : null,
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [customer, form, isOpen]);
  
  const handleFormSubmit = (data: CustomerFormValues) => {
    onSubmit(data);
  }

  const customerType = form.watch("type");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? "고객 정보 수정" : "새 고객 추가"}</DialogTitle>
          <DialogDescription>고객의 상세 정보를 입력하고 관리합니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객 유형</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="personal">개인</SelectItem>
                        <SelectItem value="company">기업</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {customerType === 'company' && (
                 <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>회사명</FormLabel>
                      <FormControl>
                        <Input placeholder="꽃길 주식회사" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{customerType === 'company' ? '담당자명' : '고객명'}</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>담당 지점</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="지점 선택" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {branches.filter(b => b.type !== '본사').map(branch => (
                                    <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>고객 등급</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="등급 선택" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="신규">신규</SelectItem>
                                <SelectItem value="일반">일반</SelectItem>
                                <SelectItem value="VIP">VIP</SelectItem>
                                <SelectItem value="VVIP">VVIP</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>태그</FormLabel>
                  <FormControl>
                    <Input placeholder="기념일, 단체주문 (쉼표로 구분)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>생일</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "yyyy년 MM월 dd일", { locale: ko }) : <span>날짜 선택</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                locale={ko}
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={new Date().getFullYear()}
                                classNames={{
                                  caption_label: 'text-lg font-medium',
                                  caption_dropdowns: 'flex flex-row-reverse gap-1 text-xs',
                                  vhidden: 'hidden',
                                }}
                             />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="anniversary"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>결혼 기념일</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "yyyy년 MM월 dd일", { locale: ko }) : <span>날짜 선택</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                                locale={ko}
                                mode="single" 
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                captionLayout="dropdown-buttons"
                                fromYear={1950}
                                toYear={new Date().getFullYear()}
                                classNames={{
                                  caption_label: 'text-lg font-medium',
                                  caption_dropdowns: 'flex flex-row-reverse gap-1 text-xs',
                                  vhidden: 'hidden',
                                }}
                             />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea placeholder="고객 관련 특이사항 기록" {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
