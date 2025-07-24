
"use client"

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StockMovement() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera not supported by this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: '카메라 접근 오류',
          description: '카메라를 사용할 수 없습니다. 브라우저 설정을 확인해주세요.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>재고 입출고</CardTitle>
        <CardDescription>바코드 스캔을 통해 자재의 입고 및 출고를 처리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>바코드 스캐너</CardTitle>
                <Video className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              </div>
              {hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>카메라 접근 불가</AlertTitle>
                  <AlertDescription>
                    카메라 권한을 허용해주세요. 브라우저 설정에서 권한을 변경할 수 있습니다.
                  </AlertDescription>
                </Alert>
              )}
               <Button className="w-full mt-4">수동으로 바코드 입력</Button>
            </CardContent>
          </Card>
          <Card>
            <Tabs defaultValue="stock-in">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stock-in">입고</TabsTrigger>
                    <TabsTrigger value="stock-out">출고</TabsTrigger>
                </TabsList>
                <TabsContent value="stock-in">
                    <CardHeader>
                        <CardTitle>입고 처리</CardTitle>
                        <CardDescription>스캔된 자재가 여기에 표시됩니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-64 border-2 border-dashed rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">스캔 대기 중...</p>
                        </div>
                        <Button className="w-full" size="lg">입고 완료</Button>
                    </CardContent>
                </TabsContent>
                <TabsContent value="stock-out">
                    <CardHeader>
                        <CardTitle>출고 처리</CardTitle>
                        <CardDescription>스캔된 자재가 여기에 표시됩니다.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="h-64 border-2 border-dashed rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">스캔 대기 중...</p>
                        </div>
                        <Button className="w-full" size="lg" variant="destructive">출고 완료</Button>
                    </CardContent>
                </TabsContent>
            </Tabs>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
