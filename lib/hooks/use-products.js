"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProducts = useProducts;
const react_1 = require("react");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase");
const use_toast_1 = require("./use-toast");
const initialProducts = [
    { id: "P00001", name: "릴리 화이트 셔츠", mainCategory: "완제품", midCategory: "꽃다발", price: 45000, supplier: "꽃길 본사", stock: 120, size: "M", color: "White", branch: "릴리맥광화문점" },
    { id: "P00002", name: "맥 데님 팬츠", mainCategory: "완제품", midCategory: "꽃바구니", price: 78000, supplier: "데님월드", stock: 80, size: "28", color: "Blue", branch: "릴리맥여의도점" },
    { id: "P00003", name: "오렌지 포인트 스커트", mainCategory: "완제품", midCategory: "꽃바구니", price: 62000, supplier: "꽃길 본사", stock: 0, size: "S", color: "Orange", branch: "릴리맥NC이스트폴점" },
    { id: "P00004", name: "그린 스트라이프 티", mainCategory: "부자재", midCategory: "포장지", price: 32000, supplier: "티셔츠팩토리", stock: 250, size: "L", color: "Green/White", branch: "릴리맥광화문점" },
    { id: "P00005", name: "베이직 블랙 슬랙스", mainCategory: "부자재", midCategory: "리본", price: 55000, supplier: "슬랙스하우스", stock: 15, size: "M", color: "Black", branch: "릴리맥여의도점" },
    { id: "P00005", name: "베이직 블랙 슬랙스", mainCategory: "부자재", midCategory: "리본", price: 55000, supplier: "슬랙스하우스", stock: 15, size: "M", color: "Black", branch: "릴리맥광화문점" },
    { id: "P00006", name: "레드로즈 꽃다발", mainCategory: "완제품", midCategory: "꽃다발", price: 55000, supplier: "꽃길 본사", stock: 30, size: "L", color: "Red", branch: "릴리맥NC이스트폴점" },
];
function useProducts() {
    const [products, setProducts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const { toast } = (0, use_toast_1.useToast)();
    const getStatus = (stock) => {
        if (stock === 0)
            return 'out_of_stock';
        if (stock < 10)
            return 'low_stock';
        return 'active';
    };
    const fetchProducts = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            const productsCollection = (0, firestore_1.collection)(firebase_1.db, 'products');
            const querySnapshot = await (0, firestore_1.getDocs)(productsCollection);
            if (querySnapshot.size <= 1) {
                const initDocRef = (0, firestore_1.doc)(productsCollection, '_initialized');
                const initDoc = await (0, firestore_1.getDoc)(initDocRef);
                if (!initDoc.exists()) {
                    const batch = (0, firestore_1.writeBatch)(firebase_1.db);
                    initialProducts.forEach((productData) => {
                        const newDocRef = (0, firestore_1.doc)(productsCollection);
                        batch.set(newDocRef, productData);
                    });
                    batch.set(initDocRef, { seeded: true });
                    await batch.commit();
                    const seededSnapshot = await (0, firestore_1.getDocs)(productsCollection);
                    const productsData = seededSnapshot.docs
                        .filter(doc => doc.id !== '_initialized')
                        .map((doc) => {
                        const data = doc.data();
                        return {
                            docId: doc.id,
                            ...data,
                            status: getStatus(data.stock)
                        };
                    }).sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
                    setProducts(productsData);
                    return;
                }
            }
            const productsData = querySnapshot.docs
                .filter(doc => doc.id !== '_initialized')
                .map((doc) => {
                const data = doc.data();
                return {
                    docId: doc.id,
                    ...data,
                    status: getStatus(data.stock)
                };
            }).sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
            setProducts(productsData);
        }
        catch (error) {
            console.error("Error fetching products: ", error);
            toast({
                variant: 'destructive',
                title: '오류',
                description: '상품 정보를 불러오는 중 오류가 발생했습니다.',
            });
        }
        finally {
            setLoading(false);
        }
    }, [toast]);
    (0, react_1.useEffect)(() => {
        fetchProducts();
    }, [fetchProducts]);
    const generateNewId = async () => {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "products"), (0, firestore_1.orderBy)("id", "desc"), (0, firestore_1.limit)(1));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        let lastIdNumber = 0;
        if (!querySnapshot.empty) {
            const lastId = querySnapshot.docs[0].data().id;
            if (lastId && lastId.startsWith('P')) {
                lastIdNumber = parseInt(lastId.replace('P', ''), 10);
            }
        }
        return `P${String(lastIdNumber + 1).padStart(5, '0')}`;
    };
    const addProduct = async (data) => {
        setLoading(true);
        try {
            const existingProductQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "products"), (0, firestore_1.where)("name", "==", data.name), (0, firestore_1.where)("branch", "==", data.branch));
            const existingProductSnapshot = await (0, firestore_1.getDocs)(existingProductQuery);
            if (!existingProductSnapshot.empty) {
                toast({ variant: 'destructive', title: '중복된 상품', description: `'${data.branch}' 지점에 동일한 이름의 상품이 이미 존재합니다.` });
                setLoading(false);
                return;
            }
            const newId = await generateNewId();
            const docRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "products"));
            await (0, firestore_1.setDoc)(docRef, { ...data, id: newId });
            toast({ title: "성공", description: "새 상품이 추가되었습니다." });
            await fetchProducts();
        }
        catch (error) {
            console.error("Error adding product:", error);
            toast({ variant: 'destructive', title: '오류', description: '상품 추가 중 오류가 발생했습니다.' });
        }
        finally {
            setLoading(false);
        }
    };
    const updateProduct = async (docId, productId, data) => {
        setLoading(true);
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, "products", docId);
            await (0, firestore_1.setDoc)(docRef, { ...data, id: productId }, { merge: true });
            toast({ title: "성공", description: "상품 정보가 수정되었습니다." });
            await fetchProducts();
        }
        catch (error) {
            console.error("Error updating product:", error);
            toast({ variant: 'destructive', title: '오류', description: '상품 수정 중 오류가 발생했습니다.' });
        }
        finally {
            setLoading(false);
        }
    };
    const deleteProduct = async (docId) => {
        setLoading(true);
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, "products", docId);
            await (0, firestore_1.deleteDoc)(docRef);
            await fetchProducts();
            toast({ title: "성공", description: "상품이 삭제되었습니다." });
        }
        catch (error) {
            console.error("Error deleting product:", error);
            toast({ variant: 'destructive', title: '오류', description: '상품 삭제 중 오류가 발생했습니다.' });
        }
        finally {
            setLoading(false);
        }
    };
    const manualUpdateStock = async (itemId, itemName, newStock, branchName, operator) => {
        try {
            await (0, firestore_1.runTransaction)(firebase_1.db, async (transaction) => {
                const productQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "products"), (0, firestore_1.where)("id", "==", itemId), (0, firestore_1.where)("branch", "==", branchName));
                const productSnapshot = await (0, firestore_1.getDocs)(productQuery);
                if (productSnapshot.empty) {
                    throw new Error(`상품을 찾을 수 없습니다: ${itemName} (${branchName})`);
                }
                const productRef = productSnapshot.docs[0].ref;
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw new Error(`상품 문서를 찾을 수 없습니다: ${itemName} (${branchName})`);
                }
                const currentStock = productDoc.data()?.stock || 0;
                transaction.update(productRef, { stock: newStock });
                const historyDocRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "stockHistory"));
                transaction.set(historyDocRef, {
                    date: (0, firestore_1.serverTimestamp)(),
                    type: "manual_update",
                    itemType: "product",
                    itemId: itemId,
                    itemName: itemName,
                    quantity: newStock - currentStock,
                    fromStock: currentStock,
                    toStock: newStock,
                    resultingStock: newStock,
                    branch: branchName,
                    operator: operator,
                });
            });
            toast({
                title: "업데이트 성공",
                description: `${itemName}의 재고가 ${newStock}으로 업데이트되었습니다.`,
            });
            await fetchProducts();
        }
        catch (error) {
            console.error("Manual stock update error:", error);
            toast({
                variant: "destructive",
                title: "재고 업데이트 오류",
                description: `재고 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    };
    const bulkAddProducts = async (data, currentBranch) => {
        setLoading(true);
        let newCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        const dataToProcess = data.filter(row => {
            const branchMatch = currentBranch === 'all' || row.branch === currentBranch;
            const hasName = row.name && String(row.name).trim() !== '';
            return branchMatch && hasName;
        });
        await Promise.all(dataToProcess.map(async (row) => {
            try {
                const stock = Number(row.current_stock ?? row.stock ?? row.quantity);
                if (isNaN(stock))
                    return;
                const productData = {
                    id: row.id || null,
                    name: String(row.name),
                    branch: String(row.branch),
                    stock: stock,
                    price: Number(row.price) || 0,
                    supplier: String(row.supplier) || '미지정',
                    mainCategory: String(row.mainCategory) || '완제품',
                    midCategory: String(row.midCategory) || '기타',
                    size: String(row.size) || '기타',
                    color: String(row.color) || '기타',
                };
                let q;
                if (productData.id) {
                    q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "products"), (0, firestore_1.where)("id", "==", productData.id), (0, firestore_1.where)("branch", "==", productData.branch));
                }
                else {
                    q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "products"), (0, firestore_1.where)("name", "==", productData.name), (0, firestore_1.where)("branch", "==", productData.branch));
                }
                const querySnapshot = await (0, firestore_1.getDocs)(q);
                if (!querySnapshot.empty) {
                    const docRef = querySnapshot.docs[0].ref;
                    await (0, firestore_1.setDoc)(docRef, productData, { merge: true });
                    updateCount++;
                }
                else {
                    const newId = productData.id || await generateNewId();
                    const newDocRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "products"));
                    await (0, firestore_1.setDoc)(newDocRef, { ...productData, id: newId });
                    newCount++;
                }
            }
            catch (error) {
                console.error("Error processing row:", row, error);
                errorCount++;
            }
        }));
        if (errorCount > 0) {
            toast({ variant: 'destructive', title: '일부 처리 오류', description: `${errorCount}개 항목 처리 중 오류가 발생했습니다.` });
        }
        toast({ title: '처리 완료', description: `성공: 신규 상품 ${newCount}개 추가, ${updateCount}개 업데이트 완료.` });
        await fetchProducts();
    };
    return { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct, bulkAddProducts, manualUpdateStock };
}
