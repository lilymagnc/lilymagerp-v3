
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

export interface LabelItem {
    id: string;
    name: string;
}

export async function fetchItemsByIds(type: 'products' | 'materials', ids: string[]): Promise<LabelItem[]> {
    if (!ids || ids.length === 0) {
        return [];
    }

    // Firestore 'in' query can take up to 30 elements per query
    const MAX_IDS_PER_QUERY = 30;
    const collectionName = type;
    const items: LabelItem[] = [];
    
    try {
        for (let i = 0; i < ids.length; i += MAX_IDS_PER_QUERY) {
            const chunk = ids.slice(i, i + MAX_IDS_PER_QUERY);
            if (chunk.length === 0) continue;

            const q = query(collection(db, collectionName), where('id', 'in', chunk));
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
                const data = doc.data() as DocumentData;
                items.push({
                    id: data.id,
                    name: data.name,
                });
            });
        }
        // The mock data doesn't exist in firestore, so we'll just return mock data based on IDs
        return ids.map(id => ({
             id, 
             name: `${type === 'products' ? '상품' : '자재'}명 ${id.slice(-3)}` 
        }));

    } catch (error) {
        console.error(`Error fetching ${type}: `, error);
        // Return mock data on error as well for now
         return ids.map(id => ({
             id, 
             name: `${type === 'products' ? '상품' : '자재'}명 ${id.slice(-3)}` 
        }));
    }
}
