
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
import { useBranches } from "@/hooks/use-branches"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc, query, where, getDocs, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import { POSITION_OPTIONS, POSITION_TO_ROLE } from "@/lib/constants";

// 직원 데이터 타입 정의
interface EmployeeData {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  contact: string;
  hireDate: Date;
  birthDate: Date;
  address: string;
  createdAt: any;
  [key: string]: any;
}

const userSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요."),
  role: z.string().min(1, "권한을 선택해주세요."),
  franchise: z.string().min(1, "소속을 선택해주세요."),
  password: z.string().optional(),
  // 직원 정보 추가 필드
  name: z.string().min(1, "이름을 입력해주세요."),
  position: z.string().min(1, "직위를 입력해주세요."),
  contact: z.string().min(1, "연락처를 입력해주세요."),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  user?: UserFormValues & { id: string } | null
  onUserUpdated?: () => void // 사용자 업데이트 후 콜백 추가
}

export function UserForm({ isOpen, onOpenChange, user, onUserUpdated }: UserFormProps) {
  const { branches } = useBranches()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const isEditMode = !!user

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      role: "",
      franchise: "",
      password: "",
      name: "",
      position: "",
      contact: "",
    },
  })

  // 수정 모드일 때 사용자 데이터와 직원 데이터를 가져와서 폼 초기화
  useEffect(() => {
    const fetchUserAndEmployeeData = async () => {
      if (isEditMode && user?.email) {
        try {
          // 사용자 데이터 설정
          const userData = {
            email: user.email,
            role: user.role,
            franchise: user.franchise,
            password: "",
            name: "",
            position: "",
            contact: "",
          }

          // 직원 데이터 가져오기
          const employeesQuery = collection(db, "employees")
          const employeeSnapshot = await getDocs(query(employeesQuery, where("email", "==", user.email)))
          
          if (!employeeSnapshot.empty) {
            const employeeDoc = employeeSnapshot.docs[0]
            const employee = employeeDoc.data() as EmployeeData
            setEmployeeData({
              ...employee,
              id: employeeDoc.id // 문서 ID 추가
            })
            
            // 직원 데이터로 폼 업데이트
            form.reset({
              ...userData,
              name: employee.name || "",
              position: employee.position || "",
              contact: employee.contact || "",
            })
          } else {
            // 직원 데이터가 없는 경우 사용자 데이터만 설정
            form.reset(userData)
          }
        } catch (error) {
          console.error("Error fetching employee data:", error)
          // 에러가 발생해도 사용자 데이터는 설정
          form.reset({
            email: user.email,
            role: user.role,
            franchise: user.franchise,
            password: "",
            name: "",
            position: "",
            contact: "",
          })
        }
      } else if (!isEditMode) {
        // 새 사용자 추가 모드일 때 폼 초기화
        form.reset({
          email: "",
          role: "",
          franchise: "",
          password: "",
          name: "",
          position: "",
          contact: "",
        })
      }
    }

    if (isOpen) {
      fetchUserAndEmployeeData()
    }
  }, [isOpen, user, isEditMode, form])

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    try {
      console.log("=== 🚀 사용자 정보 수정 시작 ===");
      console.log("📝 폼 데이터:", data);
      console.log("🔧 수정 모드:", isEditMode);
      console.log("📧 사용자 이메일:", data.email);
      console.log("🎯 선택된 권한:", data.role);
      console.log("🏢 선택된 소속:", data.franchise);
      
      // 중복 이메일 체크 (새 사용자 추가 시에만)
      if (!isEditMode) {
        const existingUserQuery = query(
          collection(db, "users"),
          where("email", "==", data.email)
        );
        const existingUser = await getDocs(existingUserQuery);
        
        if (!existingUser.empty) {
          toast({
            variant: "destructive",
            title: "중복 이메일",
            description: "이미 등록된 이메일입니다."
          });
          setLoading(false);
          return;
        }
      }

      // 최종 권한 결정
      let finalRole = data.role;
      // 수동으로 선택한 권한이 우선되도록 변경
      // if (data.position && POSITION_TO_ROLE[data.position as keyof typeof POSITION_TO_ROLE]) {
      //   finalRole = POSITION_TO_ROLE[data.position as keyof typeof POSITION_TO_ROLE];
      // }
      
      console.log("🎯 직위:", data.position);
      console.log("🎯 수동 선택된 권한:", data.role);
      console.log("🎯 최종 권한:", finalRole);

      if (isEditMode) {
        console.log("=== 🔄 수정 모드 ===");
        
        // 1. users 컬렉션 업데이트 (단순하게)
        const userDocRef = doc(db, "users", data.email);
        
        // 기존 문서 확인
        const existingDoc = await getDoc(userDocRef);
        console.log("📋 기존 문서 존재:", existingDoc.exists());
        
        if (existingDoc.exists()) {
          const currentData = existingDoc.data();
          console.log("📋 현재 데이터:", currentData);
          
          // 새로운 데이터 준비
          const newData = {
            ...currentData,
            role: finalRole,
            franchise: data.franchise,
            updatedAt: serverTimestamp()
          };
          
          console.log("📝 새 데이터:", newData);
          
          // 업데이트 실행
          await setDoc(userDocRef, newData);
          console.log("✅ users 컬렉션 업데이트 완료");
          
          // 업데이트 확인
          const verifyDoc = await getDoc(userDocRef);
          if (verifyDoc.exists()) {
            const updatedData = verifyDoc.data();
            console.log("✅ 업데이트 확인:", updatedData);
            console.log("✅ 권한이 변경되었는지 확인:", updatedData.role);
          }
        } else {
          console.log("⚠️ 문서가 존재하지 않음");
          toast({
            variant: "destructive",
            title: "오류",
            description: "사용자 문서를 찾을 수 없습니다."
          });
          setLoading(false);
          return;
        }
        
        // 2. userRoles 컬렉션 업데이트 (단순하게)
        const roleMapping = {
          "본사 관리자": "hq_manager",
          "가맹점 관리자": "branch_manager", 
          "직원": "branch_user"
        };
        
        const mappedRole = roleMapping[finalRole as keyof typeof roleMapping] || "branch_user";
        
        const userRolesQuery = query(collection(db, "userRoles"), where("email", "==", data.email));
        const userRolesSnapshot = await getDocs(userRolesQuery);
        
        if (!userRolesSnapshot.empty) {
          const userRoleDoc = userRolesSnapshot.docs[0];
          await updateDoc(userRoleDoc.ref, {
            role: mappedRole,
            branchName: data.franchise,
            updatedAt: serverTimestamp()
          });
          console.log("✅ userRoles 업데이트 완료");
        }
        
        toast({
          title: "성공",
          description: "사용자 정보가 성공적으로 수정되었습니다.",
        });
      } else {
        // 새 사용자 추가
        console.log("=== ➕ 새 사용자 추가 ===");
        
        const userDocRef = doc(db, "users", data.email);
        await setDoc(userDocRef, {
          email: data.email,
          role: finalRole,
          franchise: data.franchise,
          createdAt: serverTimestamp(),
          isActive: true
        });
        
        toast({
          title: "성공",
          description: "새 사용자가 추가되었습니다.",
        });
      }
      
      // 사용자 업데이트 콜백 호출
      if (onUserUpdated) {
        console.log("🔄 사용자 업데이트 콜백 호출");
        onUserUpdated();
      }
      
      // 다이얼로그 닫기
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
      
    } catch(error) {
      console.error("❌ Error saving user:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "사용자 정보 저장 중 오류가 발생했습니다."
      })
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "사용자 정보 수정" : "새 사용자 추가"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "사용자 권한, 소속 및 직원 정보를 수정합니다." : "새 사용자 계정을 생성하고 직원 정보를 함께 등록합니다."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="user-email">이메일</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="user@example.com" 
                      {...field} 
                      disabled={isEditMode}
                      id="user-email"
                      name="email"
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="user-name">이름</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="홍길동" 
                      {...field}
                      id="user-name"
                      name="name"
                      autoComplete="name"
                    />
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
                  <FormLabel htmlFor="user-contact">연락처</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="010-1234-5678" 
                      {...field}
                      id="user-contact"
                      name="contact"
                      autoComplete="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="user-position">직위</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // 직위 변경 시 권한 자동 업데이트 제거 (수동 권한 선택 우선)
                    // const newRole = POSITION_TO_ROLE[value as keyof typeof POSITION_TO_ROLE];
                    // if (newRole) {
                    //   form.setValue("role", newRole);
                    // }
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="user-position" name="position">
                        <SelectValue placeholder="직위 선택" id="user-position-value" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent id="user-position-content">
                      {POSITION_OPTIONS.map(option => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value} 
                          id={`position-${option.value}`}
                          className="cursor-pointer"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="user-role">권한</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="user-role" name="role">
                        <SelectValue placeholder="권한 선택" id="user-role-value" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent id="user-role-content">
                      <SelectItem value="본사 관리자" id="role-hq-manager" className="cursor-pointer">본사 관리자</SelectItem>
                      <SelectItem value="가맹점 관리자" id="role-branch-manager" className="cursor-pointer">가맹점 관리자</SelectItem>
                      <SelectItem value="직원" id="role-employee" className="cursor-pointer">직원</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="franchise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="user-franchise">소속</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="user-franchise" name="franchise">
                        <SelectValue placeholder="소속 선택" id="user-franchise-value" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent id="user-franchise-content">
                      <SelectItem value="본사" id="franchise-hq" className="cursor-pointer">본사</SelectItem>
                      {branches.map(branch => (
                        <SelectItem 
                          key={branch.id} 
                          value={branch.name} 
                          id={`franchise-${branch.id}`}
                          className="cursor-pointer"
                        >
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="user-password">임시 비밀번호</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="임시 비밀번호" 
                        {...field}
                        id="user-password"
                        name="password"
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">취소</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "수정" : "추가"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
