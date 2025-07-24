
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBranches } from "@/hooks/use-branches"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown, Check } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"

const mainCategories = [
  { value: "생화", label: "생화" },
  { value: "조화", label: "조화" },
  { value: "화분", label: "화분" },
  { value: "기타자재", label: "기타자재" },
]

const midCategories = [
    { value: "장미", label: "장미" },
    { value: "카네이션", label: "카네이션" },
    { value: "관엽식물", label: "관엽식물" },
    { value: "난", label: "난" },
]

const materialSchema = z.object({
  name: z.string().min(1, "자재명을 입력해주세요."),
  mainCategory: z.string().min(1, "대분류를 선택해주세요."),
  midCategory: z.string().min(1, "중분류를 선택해주세요."),
  price: z.coerce.number().min(0, "가격은 0 이상이어야 합니다."),
  supplier: z.string().min(1, "공급업체를 선택해주세요."),
  size: z.string().min(1, "규격을 입력해주세요."),
  color: z.string().min(1, "색상을 입력해주세요."),
  branch: z.string().min(1, "지점을 선택해주세요."),
})

type MaterialFormValues = z.infer<typeof materialSchema>

interface MaterialFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  material?: MaterialFormValues & { id: string } | null
}

export function MaterialForm({ isOpen, onOpenChange, material }: MaterialFormProps) {
  const { branches } = useBranches();

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: material || {
      name: "",
      mainCategory: "",
      midCategory: "",
      price: 0,
      supplier: "",
      size: "",
      color: "",
      branch: "",
    },
  })

  const onSubmit = (data: MaterialFormValues) => {
    console.log(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{material ? "자재 정보 수정" : "새 자재 추가"}</DialogTitle>
          <DialogDescription>자재의 상세 정보를 입력해주세요.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>자재명</FormLabel>
                  <FormControl>
                    <Input placeholder="마르시아 장미" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mainCategory"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>대분류</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? mainCategories.find(
                                  (category) => category.value === field.value
                                )?.label
                              : "대분류 선택"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="분류 검색 또는 추가..." />
                          <CommandEmpty>분류를 찾을 수 없습니다.</CommandEmpty>
                          <CommandGroup>
                            {mainCategories.map((category) => (
                              <CommandItem
                                value={category.label}
                                key={category.value}
                                onSelect={() => {
                                  form.setValue("mainCategory", category.value)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    category.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category.label}
                              </CommandItem>
                            ))}
                             <CommandItem
                                onSelect={() => {
                                  const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
                                  if (input) {
                                      form.setValue("mainCategory", input.value);
                                  }
                                }}
                                >
                                <span className="mr-2 h-4 w-4" />
                                <span className="italic">새 분류 추가...</span>
                            </CommandItem>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="midCategory"
                render={({ field }) => (
                   <FormItem className="flex flex-col">
                    <FormLabel>중분류</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? midCategories.find(
                                  (category) => category.value === field.value
                                )?.label
                              : "중분류 선택"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="분류 검색 또는 추가..." />
                          <CommandEmpty>분류를 찾을 수 없습니다.</CommandEmpty>
                          <CommandGroup>
                            {midCategories.map((category) => (
                              <CommandItem
                                value={category.label}
                                key={category.value}
                                onSelect={() => {
                                  form.setValue("midCategory", category.value)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    category.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category.label}
                              </CommandItem>
                            ))}
                             <CommandItem
                                onSelect={() => {
                                  const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
                                  if (input) {
                                      form.setValue("midCategory", input.value);
                                  }
                                }}
                                >
                                <span className="mr-2 h-4 w-4" />
                                <span className="italic">새 분류 추가...</span>
                            </CommandItem>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가격</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>규격</FormLabel>
                        <FormControl>
                        <Input placeholder="1단" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>색상</FormLabel>
                        <FormControl>
                        <Input placeholder="Pink" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>공급업체</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="공급업체 선택" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="경부선꽃시장">경부선꽃시장</SelectItem>
                      <SelectItem value="플라워팜">플라워팜</SelectItem>
                      <SelectItem value="자재월드">자재월드</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>소속 지점</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="소속 지점 선택" /></SelectTrigger>
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
