"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMaterials = useMaterials;
const react_1 = require("react");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase");
const use_toast_1 = require("./use-toast");
const initialMaterials = [
    { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, size: "1단", color: "Pink", branch: "릴리맥광화문점" },
    { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 80, size: "1단", color: "Pink", branch: "릴리맥여의도점" },
    { id: "M00002", name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, size: "1단", color: "Red", branch: "릴리맥여의도점" },
    { id: "M00003", name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, size: "대", color: "Green", branch: "릴리맥광화문점" },
    { id: "M00004", name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, size: "특", color: "Purple", branch: "릴리맥NC이스트폴점" },
    { id: "M00005", name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "기타", price: 1000, supplier: "자재월드", stock: 15, size: "1롤", color: "Brown", branch: "릴리맥여의도점" },
    { id: "M00006", name: "유칼립투스", mainCategory: "생화", midCategory: "기타", price: 3000, supplier: "플라워팜", stock: 50, size: "1단", color: "Green", branch: "릴리맥광화문점" },
];
function useMaterials() {
    const [materials, setMaterials] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const { toast } = (0, use_toast_1.useToast)();
    const getStatus = (stock) => {
        if (stock === 0)
            return 'out_of_stock';
        if (stock < 10)
            return 'low_stock';
        return 'active';
    };
    const fetchMaterials = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            const materialsCollection = (0, firestore_1.collection)(firebase_1.db, 'materials');
            const querySnapshot = await (0, firestore_1.getDocs)(materialsCollection);
            if (querySnapshot.size <= 1) {
                const initDocRef = (0, firestore_1.doc)(materialsCollection, '_initialized');
                const initDoc = await (0, firestore_1.getDoc)(initDocRef);
                if (!initDoc.exists()) {
                    const batch = (0, firestore_1.writeBatch)(firebase_1.db);
                    initialMaterials.forEach((materialData) => {
                        const newDocRef = (0, firestore_1.doc)(materialsCollection);
                        batch.set(newDocRef, materialData);
                    });
                    batch.set(initDocRef, { seeded: true });
                    await batch.commit();
                    const seededSnapshot = await (0, firestore_1.getDocs)(materialsCollection);
                    const materialsData = seededSnapshot.docs
                        .filter(doc => doc.id !== '_initialized')
                        .map((doc) => {
                        const data = doc.data();
                        return {
                            docId: doc.id,
                            ...data,
                            status: getStatus(data.stock)
                        };
                    }).sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
                    setMaterials(materialsData);
                    return;
                }
            }
            const materialsData = querySnapshot.docs
                .filter(doc => doc.id !== '_initialized')
                .map((doc) => {
                const data = doc.data();
                return {
                    docId: doc.id,
                    ...data,
                    status: getStatus(data.stock)
                };
            }).sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
            setMaterials(materialsData);
        }
        catch (error) {
            console.error("Error fetching materials: ", error);
            toast({
                variant: 'destructive',
                title: '오류',
                description: '자재 정보를 불러오는 중 오류가 발생했습니다.',
            });
        }
        finally {
            setLoading(false);
        }
    }, [toast]);
    (0, react_1.useEffect)(() => {
        fetchMaterials();
    }, [fetchMaterials]);
    const generateNewId = async () => {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "materials"), (0, firestore_1.orderBy)("id", "desc"), (0, firestore_1.limit)(1));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        let lastIdNumber = 0;
        if (!querySnapshot.empty) {
            const lastId = querySnapshot.docs[0].data().id;
            if (lastId && lastId.startsWith('M')) {
                lastIdNumber = parseInt(lastId.replace('M', ''), 10);
            }
        }
        return `M${String(lastIdNumber + 1).padStart(5, '0')}`;
    };
    const addMaterial = async (data) => {
        setLoading(true);
        try {
            const existingMaterialQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "materials"), (0, firestore_1.where)("name", "==", data.name), (0, firestore_1.where)("branch", "==", data.branch));
            const existingMaterialSnapshot = await (0, firestore_1.getDocs)(existingMaterialQuery);
            if (!existingMaterialSnapshot.empty) {
                toast({ variant: 'destructive', title: '중복된 자재', description: `'${data.branch}' 지점에 동일한 이름의 자재가 이미 존재합니다.` });
                setLoading(false);
                return;
            }
            const newId = await generateNewId();
            const docRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "materials"));
            await (0, firestore_1.setDoc)(docRef, { ...data, id: newId });
            toast({ title: "성공", description: "새 자재가 추가되었습니다." });
            await fetchMaterials();
        }
        catch (error) {
            console.error("Error adding material:", error);
            toast({ variant: 'destructive', title: '오류', description: '자재 추가 중 오류가 발생했습니다.' });
        }
        finally {
            setLoading(false);
        }
    };
    const updateMaterial = async (docId, materialId, data) => {
        setLoading(true);
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, "materials", docId);
            await (0, firestore_1.setDoc)(docRef, { ...data, id: materialId }, { merge: true });
            toast({ title: "성공", description: "자재 정보가 수정되었습니다." });
            await fetchMaterials();
        }
        catch (error) {
            console.error("Error updating material:", error);
            toast({ variant: 'destructive', title: '오류', description: '자재 수정 중 오류가 발생했습니다.' });
        }
        finally {
            setLoading(false);
        }
    };
    const deleteMaterial = async (docId) => {
        setLoading(true);
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, "materials", docId);
            await (0, firestore_1.deleteDoc)(docRef);
            await fetchMaterials();
            toast({ title: "성공", description: "자재가 삭제되었습니다." });
        }
        catch (error) {
            console.error("Error deleting material:", error);
            toast({ variant: 'destructive', title: '오류', description: '자재 삭제 중 오류가 발생했습니다.' });
        }
        finally {
            setLoading(false);
        }
    };
    const updateStock = async (items, type, branchName, operator) => {
        const historyBatch = (0, firestore_1.writeBatch)(firebase_1.db);
        for (const item of items) {
            try {
                await (0, firestore_1.runTransaction)(firebase_1.db, async (transaction) => {
                    const materialQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "materials"), (0, firestore_1.where)("id", "==", item.id), (0, firestore_1.where)("branch", "==", branchName));
                    const materialSnapshot = await (0, firestore_1.getDocs)(materialQuery);
                    if (materialSnapshot.empty) {
                        throw new Error(`자재를 찾을 수 없습니다: ${item.name} (${branchName})`);
                    }
                    const materialDocRef = materialSnapshot.docs[0].ref;
                    const materialDoc = await transaction.get(materialDocRef);
                    if (!materialDoc.exists()) {
                        throw new Error(`자재 문서를 찾을 수 없습니다: ${item.name} (${branchName})`);
                    }
                    const materialData = materialDoc.data();
                    const currentStock = materialData?.stock || 0;
                    const change = type === 'in' ? item.quantity : -item.quantity;
                    const newStock = currentStock + change;
                    const updatePayload = { stock: newStock };
                    if (type === 'in') {
                        if (item.price !== undefined)
                            updatePayload.price = item.price;
                        if (item.supplier !== undefined)
                            updatePayload.supplier = item.supplier;
                    }
                    transaction.update(materialDocRef, updatePayload);
                    const historyDocRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "stockHistory"));
                    historyBatch.set(historyDocRef, {
                        date: (0, firestore_1.serverTimestamp)(),
                        type: type,
                        itemType: "material",
                        itemId: item.id,
                        itemName: item.name,
                        quantity: item.quantity,
                        fromStock: currentStock,
                        toStock: newStock,
                        resultingStock: newStock,
                        branch: branchName,
                        operator: operator,
                        supplier: type === 'in' ? (item.supplier || materialData?.supplier) : materialData?.supplier,
                        price: type === 'in' ? (item.price || materialData?.price) : materialData?.price,
                        totalAmount: type === 'in' ? ((item.price || materialData?.price || 0) * item.quantity) : 0,
                    });
                });
            }
            catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "재고 업데이트 오류",
                    description: `${item.name}의 재고를 업데이트하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
                });
                // Continue to next item
            }
        }
        await historyBatch.commit();
        await fetchMaterials();
    };
    const manualUpdateStock = async (itemId, itemName, newStock, branchName, operator) => {
        try {
            await (0, firestore_1.runTransaction)(firebase_1.db, async (transaction) => {
                const materialQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "materials"), (0, firestore_1.where)("id", "==", itemId), (0, firestore_1.where)("branch", "==", branchName));
                const materialSnapshot = await (0, firestore_1.getDocs)(materialQuery);
                if (materialSnapshot.empty) {
                    throw new Error(`자재를 찾을 수 없습니다: ${itemName} (${branchName})`);
                }
                const materialRef = materialSnapshot.docs[0].ref;
                const materialDoc = await transaction.get(materialRef);
                if (!materialDoc.exists()) {
                    throw new Error(`자재 문서를 찾을 수 없습니다: ${itemName} (${branchName})`);
                }
                const currentStock = materialDoc.data()?.stock || 0;
                transaction.update(materialRef, { stock: newStock });
                const historyDocRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "stockHistory"));
                transaction.set(historyDocRef, {
                    date: (0, firestore_1.serverTimestamp)(),
                    type: "manual_update",
                    itemType: "material",
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
            await fetchMaterials();
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
    const bulkAddMaterials = async (data, currentBranch) => {
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
                const materialData = {
                    id: row.id || null,
                    name: String(row.name),
                    branch: String(row.branch),
                    stock: stock,
                    price: Number(row.price) || 0,
                    supplier: String(row.supplier) || '미지정',
                    mainCategory: String(row.mainCategory) || '기타자재',
                    midCategory: String(row.midCategory) || '기타',
                    size: String(row.size) || '기타',
                    color: String(row.color) || '기타',
                };
                let q;
                if (materialData.id) {
                    q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "materials"), (0, firestore_1.where)("id", "==", materialData.id), (0, firestore_1.where)("branch", "==", materialData.branch));
                }
                else {
                    q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "materials"), (0, firestore_1.where)("name", "==", materialData.name), (0, firestore_1.where)("branch", "==", materialData.branch));
                }
                const querySnapshot = await (0, firestore_1.getDocs)(q);
                if (!querySnapshot.empty) {
                    const docRef = querySnapshot.docs[0].ref;
                    await (0, firestore_1.setDoc)(docRef, materialData, { merge: true });
                    updateCount++;
                }
                else {
                    const newId = materialData.id || await generateNewId();
                    const newDocRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "materials"));
                    await (0, firestore_1.setDoc)(newDocRef, { ...materialData, id: newId });
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
        toast({ title: '처리 완료', description: `성공: 신규 자재 ${newCount}개 추가, ${updateCount}개 업데이트 완료.` });
        await fetchMaterials();
    };
    return { materials, loading, updateStock, fetchMaterials, manualUpdateStock, addMaterial, updateMaterial, deleteMaterial, bulkAddMaterials };
}
