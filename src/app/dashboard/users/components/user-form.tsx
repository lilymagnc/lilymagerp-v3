
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
import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

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
}

export function UserForm({ isOpen, onOpenChange, user }: UserFormProps) {
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
          const { getDocs, query, where } = await import("firebase/firestore")
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
      // 사용자 정보 저장
      const { password, name, position, contact, ...userData } = data;
      const userDocRef = doc(db, "users", data.email);
      await setDoc(userDocRef, userData, { merge: true });
      
      if (isEditMode) {
        // 수정 모드: 직원 정보 업데이트
        if (employeeData && employeeData.id) {
          // 기존 직원 문서 업데이트
          const { updateDoc } = await import("firebase/firestore")
          const employeeRef = doc(db, "employees", employeeData.id)
          await updateDoc(employeeRef, {
            name,
            position,
            department: data.franchise,
            contact,
            updatedAt: serverTimestamp(),
          })
        } else {
          // 직원 정보가 없는 경우 새로 생성
          const newEmployeeData = {
            name,
            email: data.email,
            position,
            department: data.franchise,
            contact,
            hireDate: new Date(),
            birthDate: new Date(),
            address: "",
            createdAt: serverTimestamp(),
          };
          
          await addDoc(collection(db, 'employees'), newEmployeeData);
        }
        
        toast({
          title: "성공",
          description: "사용자 정보가 성공적으로 수정되었습니다.",
        });
      } else {
        // 새 사용자 추가 시에만 직원 정보도 함께 추가
        const employeeData = {
          name,
          email: data.email,
          position,
          department: data.franchise, // 소속을 부서로 매핑
          contact,
          hireDate: new Date(), // 현재 날짜를 입사일로 설정
          birthDate: new Date(), // 기본값 설정 (나중에 수정 가능)
          address: "", // 기본값
          createdAt: serverTimestamp(),
        };
        
        await addDoc(collection(db, 'employees'), employeeData);
        
        toast({
          title: "성공",
          description: "사용자 계정과 직원 정보가 모두 추가되었습니다.",
        });
      }
      
      onOpenChange(false);
    } catch(error) {
      console.error("Error saving user:", error);
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
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} disabled={isEditMode} />
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
                  <FormLabel>이름</FormLabel>
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
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>직위</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="직위 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="대표">대표</SelectItem>
                      <SelectItem value="점장">점장</SelectItem>
                      <SelectItem value="매니저">매니저</SelectItem>
                      <SelectItem value="직원">직원</SelectItem>
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
                  <FormLabel>권한</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="권한 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="본사 관리자">본사 관리자</SelectItem>
                      <SelectItem value="가맹점 관리자">가맹점 관리자</SelectItem>
                      <SelectItem value="직원">직원</SelectItem>
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
                  <FormLabel>소속</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="소속 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="본사">본사</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
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
                    <FormLabel>임시 비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="임시 비밀번호" {...field} />
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
