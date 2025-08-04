"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { useProducts } from "@/hooks/use-products";
import { useMaterials } from "@/hooks/use-materials";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Save, X, ScanLine, Camera, Keyboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScannedItem {
  id: string;
  name: string;
  type: 'product' | 'material';
  currentStock: number;
  originalStock: number;
  branch: string;
  price: number;
  supplier: string;
  docId?: string;
}

export default function BarcodeScannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { products, manualUpdateStock: updateProductStock } = useProducts();
  const { materials, manualUpdateStock: updateMaterialStock } = useMaterials();
  
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(user?.franchise || "all");
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 페이지 로드 시 바코드 입력 필드에 포커스
  useEffect(() => {
    if (barcodeInputRef.current && scanMode === 'manual') {
      barcodeInputRef.current.focus();
    }
  }, [scanMode]);

  // 키보드 이벤트 리스너 (전역 바코드 스캔 감지)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // 키 입력 간격이 50ms 이하면 바코드 스캐너로 간주
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = '';
      }
      
      lastKeyTime = currentTime;
      
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        // 바코드 스캔 완료
        e.preventDefault();
        searchByBarcode(barcodeBuffer);
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        // 일반 문자 입력
        barcodeBuffer += e.key;
      }
    };

    if (scanMode === 'manual') {
      document.addEventListener('keypress', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [scanMode]);

  // 카메라 시작
  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // 후면 카메라 사용
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      toast({
        variant: "destructive",
        title: "카메라 오류",
        description: "카메라에 접근할 수 없습니다. 권한을 확인해주세요.",
      });
      setIsScanning(false);
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // 바코드로 상품/자재 검색
  const searchByBarcode = (barcode: string) => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    // 상품에서 검색
    const product = products.find(p => p.id === trimmedBarcode);
    if (product) {
      const existingItem = scannedItems.find(item => item.id === product.id && item.type === 'product');
      if (existingItem) {
        toast({
          title: "이미 스캔됨",
          description: `${product.name}은(는) 이미 스캔 목록에 있습니다.`,
        });
        return;
      }

      const newItem: ScannedItem = {
        id: product.id,
        name: product.name,
        type: 'product',
        currentStock: product.stock,
        originalStock: product.stock,
        branch: product.branch,
        price: product.price,
        supplier: product.supplier,
        docId: product.docId,
      };

      setScannedItems(prev => [...prev, newItem]);
      setBarcodeInput("");
      toast({
        title: "상품 스캔 완료",
        description: `${product.name}이(가) 스캔 목록에 추가되었습니다.`,
      });
      
      // 바코드 입력 필드에 다시 포커스
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      return;
    }

    // 자재에서 검색
    const material = materials.find(m => m.id === trimmedBarcode);
    if (material) {
      const existingItem = scannedItems.find(item => item.id === material.id && item.type === 'material');
      if (existingItem) {
        toast({
          title: "이미 스캔됨",
          description: `${material.name}은(는) 이미 스캔 목록에 있습니다.`,
        });
        return;
      }

      const newItem: ScannedItem = {
        id: material.id,
        name: material.name,
        type: 'material',
        currentStock: material.stock,
        originalStock: material.stock,
        branch: material.branch,
        price: material.price,
        supplier: material.supplier,
        docId: material.docId,
      };

      setScannedItems(prev => [...prev, newItem]);
      setBarcodeInput("");
      toast({
        title: "자재 스캔 완료",
        description: `${material.name}이(가) 스캔 목록에 추가되었습니다.`,
      });
      
      // 바코드 입력 필드에 다시 포커스
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      return;
    }

    toast({
      variant: "destructive",
      title: "찾을 수 없음",
      description: `바코드 ${trimmedBarcode}에 해당하는 상품/자재를 찾을 수 없습니다.`,
    });
    
    // 바코드 입력 필드에 다시 포커스
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // 수량 변경
  const updateStock = (itemId: string, itemType: 'product' | 'material', newStock: number) => {
    setScannedItems(prev => 
      prev.map(item => 
        item.id === itemId && item.type === itemType
          ? { ...item, currentStock: newStock }
          : item
      )
    );
  };

  // 입고 (+1)
  const handleInStock = (item: ScannedItem) => {
    updateStock(item.id, item.type, item.currentStock + 1);
  };

  // 출고 (-1)
  const handleOutStock = (item: ScannedItem) => {
    if (item.currentStock > 0) {
      updateStock(item.id, item.type, item.currentStock - 1);
    } else {
      toast({
        variant: "destructive",
        title: "재고 부족",
        description: `${item.name}의 재고가 0입니다.`,
      });
    }
  };

  // 변경사항 저장
  const handleSaveChanges = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      const changedItems = scannedItems.filter(item => item.currentStock !== item.originalStock);

      for (const item of changedItems) {
        try {
          if (item.type === 'product') {
            await updateProductStock(item.id, item.name, item.currentStock, item.branch, user?.email || "Unknown User");
            successCount++;
          } else if (item.type === 'material') {
            await updateMaterialStock(item.id, item.name, item.currentStock, item.branch, user?.email || "Unknown User");
            successCount++;
          }
        } catch (error) {
          console.error(`Error updating ${item.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "저장 완료",
          description: `${successCount}개 항목이 성공적으로 업데이트되었습니다.${errorCount > 0 ? ` (${errorCount}개 실패)` : ''}`,
        });
        setScannedItems([]);
      } else if (errorCount > 0) {
        toast({
          variant: "destructive",
          title: "저장 실패",
          description: `${errorCount}개 항목 업데이트 중 오류가 발생했습니다.`,
        });
      } else {
        toast({
          title: "변경사항 없음",
          description: "저장할 변경사항이 없습니다.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: "변경사항 저장 중 오류가 발생했습니다.",
      });
    }
  };

  // 아이템 제거
  const removeItem = (itemId: string, itemType: 'product' | 'material') => {
    setScannedItems(prev => 
      prev.filter(item => !(item.id === itemId && item.type === itemType))
    );
  };

  // 필터링된 아이템
  const filteredItems = scannedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 변경사항이 있는 아이템 수
  const changedItemsCount = scannedItems.filter(item => item.currentStock !== item.originalStock).length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="바코드 스캐너" 
        description="바코드를 스캔하여 재고를 관리합니다."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 바코드 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              바코드 스캔
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 스캔 모드 선택 */}
            <Tabs value={scanMode} onValueChange={(value) => {
              setScanMode(value as 'manual' | 'camera');
              if (value === 'camera') {
                startCamera();
              } else {
                stopCamera();
              }
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  수동 입력
                </TabsTrigger>
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  카메라 스캔
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="바코드를 입력하거나 스캔하세요..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchByBarcode(barcodeInput);
                      }
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <Button onClick={() => searchByBarcode(barcodeInput)}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <Alert>
                  <ScanLine className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>• 바코드 스캐너를 연결하고 스캔하세요</p>
                      <p>• 또는 바코드를 직접 입력하고 Enter를 누르세요</p>
                      <p>• 상품과 자재 모두 검색 가능합니다</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="camera" className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg"
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-600">카메라 스캔 준비 중...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={startCamera} 
                    disabled={isScanning}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    카메라 시작
                  </Button>
                  <Button 
                    onClick={stopCamera} 
                    disabled={!isScanning}
                    variant="outline"
                    className="flex-1"
                  >
                    카메라 중지
                  </Button>
                </div>
                
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    카메라 스캔 기능은 현재 개발 중입니다. 수동 입력 모드를 사용해주세요.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 스캔 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>스캔 결과 ({scannedItems.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {scannedItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ScanLine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>스캔된 항목이 없습니다.</p>
                <p className="text-sm mt-2">바코드를 스캔하여 시작하세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="스캔 결과 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredItems.map((item) => {
                    const isChanged = item.currentStock !== item.originalStock;
                    return (
                      <div key={`${item.type}-${item.id}`} className={`border rounded-lg p-3 space-y-2 ${isChanged ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                                {item.type === 'product' ? '상품' : '자재'}
                              </Badge>
                              <span className="font-medium">{item.name}</span>
                              {isChanged && (
                                <Badge variant="outline" className="text-xs">
                                  변경됨
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              바코드: {item.id} | 지점: {item.branch}
                            </div>
                            {isChanged && (
                              <div className="text-xs text-blue-600 mt-1">
                                {item.originalStock} → {item.currentStock}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id, item.type)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOutStock(item)}
                            disabled={item.currentStock <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={item.currentStock}
                            onChange={(e) => {
                              const newStock = parseInt(e.target.value);
                              if (!isNaN(newStock) && newStock >= 0) {
                                updateStock(item.id, item.type, newStock);
                              }
                            }}
                            className="w-20 text-center"
                            min="0"
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInStock(item)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={changedItemsCount === 0}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    변경사항 저장 {changedItemsCount > 0 && `(${changedItemsCount}개)`}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setScannedItems([])}
                    disabled={scannedItems.length === 0}
                  >
                    목록 초기화
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}