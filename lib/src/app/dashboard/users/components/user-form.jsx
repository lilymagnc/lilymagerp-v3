"use client";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
const userSchema = z.object({
    email: z.string().email("유효한 이메일을 입력해주세요."),
    role: z.string().min(1, "권한을 선택해주세요."),
    franchise: z.string().min(1, "소속을 선택해주세요."),
    password: z.string().optional(),
});
export function UserForm({ isOpen, onOpenChange, user }) {
    const isEditMode = !!user;
    const { branches } = useBranches();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: user || {
            email: "",
            role: "",
            franchise: "",
            password: "",
        },
    });
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // In a real app, you would have a backend function to create/update users to handle auth and firestore together.
            // Here, we'll just update/create the firestore document.
            const { password } = data, userData = __rest(data, ["password"]); // Don't save password in firestore
            const userDocRef = doc(db, "users", data.email);
            await setDoc(userDocRef, userData, { merge: isEditMode });
            toast({
                title: "성공",
                description: `사용자 정보가 성공적으로 ${isEditMode ? '수정' : '추가'}되었습니다.`,
            });
            onOpenChange(false);
        }
        catch (error) {
            console.error("Error saving user:", error);
            toast({
                variant: "destructive",
                title: "오류",
                description: "사용자 정보 저장 중 오류가 발생했습니다."
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "사용자 정보 수정" : "새 사용자 추가"}</DialogTitle>
          <DialogDescription>{isEditMode ? "사용자의 권한 및 소속을 변경합니다." : "새로운 사용자를 시스템에 등록합니다."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="user@ggotgil.com" {...field} disabled={isEditMode}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
            {!isEditMode && (<FormField control={form.control} name="password" render={({ field }) => (<FormItem>
                    <FormLabel>초기 비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>)}
            <FormField control={form.control} name="role" render={({ field }) => (<FormItem>
                  <FormLabel>권한</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="권한 선택"/></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="본사 관리자">본사 관리자</SelectItem>
                      <SelectItem value="가맹점 관리자">가맹점 관리자</SelectItem>
                      <SelectItem value="직원">직원</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>)}/>
            <FormField control={form.control} name="franchise" render={({ field }) => (<FormItem>
                  <FormLabel>소속</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="소속 지점 선택"/></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map(branch => (<SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>)}/>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={loading}>취소</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                저장
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>);
}
