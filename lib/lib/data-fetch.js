"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemData = getItemData;
exports.getItemsData = getItemsData;
// This is a placeholder file for data fetching logic.
// In a real app, you would fetch data from a database or API.
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("./firebase");
async function getItemData(id, type) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    const collectionName = type === 'product' ? 'products' : 'materials';
    const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, collectionName), (0, firestore_1.where)("id", "==", id), (0, firestore_1.limit)(1));
    try {
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                id: data.id,
                name: data.name
            };
        }
        return null;
    }
    catch (e) {
        console.error("Error fetching item data", e);
        return null;
    }
}
async function getItemsData(ids, type) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const results = await Promise.all(ids.map(id => getItemData(id, type)));
    return results.filter((item) => item !== null);
}
