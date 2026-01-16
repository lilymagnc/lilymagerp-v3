import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Search } from "lucide-react";
import { Product } from "@/hooks/use-products";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProductSectionProps {
    topFlowerProducts: Product[];
    topPlantProducts: Product[];
    topWreathProducts: Product[];
    shoppingBagProducts: Product[];
    allProducts: Product[]; // Full list of products for the branch
    onAddProduct: (product: Product) => void;
    onOpenCustomProductDialog: () => void;
    onTabChange?: (tab: string) => void;
}

export function ProductSection({
    topFlowerProducts,
    topPlantProducts,
    topWreathProducts,
    shoppingBagProducts,
    allProducts,
    onAddProduct,
    onOpenCustomProductDialog,
    onTabChange
}: ProductSectionProps) {
    const [activeTab, setActiveTab] = useState("flower");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredAllProducts = allProducts.filter(p => {
        // 1. Text Search Filter
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Category Filter based on Active Tab
        let matchesCategory = true;

        // Avoid filtering if searching globally? Usually standard UX is filter within category, 
        // OR search overrides category. 
        // User request: "When category is selected, product list should show THAT category products only."
        // We will prioritize Category Filter ALWAYS, unless maybe strict all-search is needed.
        // Let's filter by category.

        if (activeTab === 'flower') {
            matchesCategory = p.mainCategory === '플라워';
        } else if (activeTab === 'plant') {
            matchesCategory = p.mainCategory === '플랜트';
        } else if (activeTab === 'wreath') {
            matchesCategory = p.mainCategory === '경조화환';
        } else if (activeTab === 'shoppingbag') {
            // Logic for shopping bag / 'etc'
            matchesCategory = p.name.includes('쇼핑백') || p.mainCategory === '자재' || p.mainCategory === '기타';
        }

        return matchesSearch && matchesCategory;
    });

    const ProductGrid = ({ products }: { products: Product[] }) => {
        if (products.length === 0) {
            return <div className="text-center py-8 text-muted-foreground text-sm">등록된 상품이 없습니다.</div>;
        }
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {products.map((product) => (
                    <Button
                        key={product.id}
                        variant="outline"
                        className="h-auto py-3 min-h-[5rem] flex flex-col items-center justify-center space-y-1 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                        onClick={() => onAddProduct(product)}
                        disabled={product.stock <= 0}
                    >
                        <span className="font-bold text-sm text-center leading-tight break-keep line-clamp-2 text-foreground group-hover:text-primary">
                            {product.name}
                        </span>
                        <span className="text-sm font-bold text-primary">
                            {product.price.toLocaleString()}원
                        </span>
                        {product.stock <= 0 && <Badge variant="destructive" className="text-[10px] h-5 px-1 mt-1">품절</Badge>}
                        {product.stock > 0 && <span className="text-[10px] text-muted-foreground">재고: {product.stock}</span>}
                    </Button>
                ))}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">상품 선택</CardTitle>
                <Button variant="outline" size="sm" onClick={onOpenCustomProductDialog}>
                    <Plus className="w-4 h-4 mr-1" />
                    직접 입력
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(val) => {
                    setActiveTab(val);
                    onTabChange?.(val);
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4">
                        <TabsTrigger value="flower">꽃다발/바구니</TabsTrigger>
                        <TabsTrigger value="plant">관엽식물/동서양란</TabsTrigger>
                        <TabsTrigger value="wreath">경조화환</TabsTrigger>
                        <TabsTrigger value="shoppingbag">쇼핑백/기타</TabsTrigger>
                        {/* Added 'all' tab or keep distinct? Maybe just the search below is enough. */}
                    </TabsList>

                    <TabsContent value="flower" className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">인기 상품 (Top 10)</h4>
                            </div>
                            <ProductGrid products={topFlowerProducts} />
                        </div>
                    </TabsContent>

                    <TabsContent value="plant" className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">인기 상품 (Top 10)</h4>
                            </div>
                            <ProductGrid products={topPlantProducts} />
                        </div>
                    </TabsContent>

                    <TabsContent value="wreath" className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">인기 상품 (Top 5)</h4>
                            </div>
                            <ProductGrid products={topWreathProducts} />
                        </div>
                    </TabsContent>

                    <TabsContent value="shoppingbag" className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">쇼핑백 및 기타 자재</h4>
                            <ProductGrid products={shoppingBagProducts} />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 pt-4 border-t space-y-3">
                    <Label>상품 전체 검색 및 선택</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="상품명 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select onValueChange={(val) => {
                            const p = allProducts.find(prod => prod.docId === val);
                            if (p) {
                                onAddProduct(p);
                                setSearchTerm(""); // Reset search? Optional
                            }
                        }}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="상품 목록 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredAllProducts.slice(0, 50).map(p => (
                                    <SelectItem key={p.docId} value={p.docId} disabled={p.stock <= 0}>
                                        {p.name} ({p.price.toLocaleString()}원)
                                    </SelectItem>
                                ))}
                                {filteredAllProducts.length > 50 && (
                                    <div className="p-2 text-xs text-center text-muted-foreground">
                                        검색 결과가 너무 많습니다. 검색어를 입력해주세요.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Suggestion Grid for Search Terms */}
                    {searchTerm && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {filteredAllProducts.slice(0, 6).map(p => (
                                <Button
                                    key={p.id}
                                    variant="ghost"
                                    className="justify-start h-auto py-2 text-left"
                                    onClick={() => {
                                        onAddProduct(p);
                                        setSearchTerm("");
                                    }}
                                    disabled={p.stock <= 0}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{p.name}</span>
                                        <span className="text-xs text-muted-foreground">{p.price.toLocaleString()}원</span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
