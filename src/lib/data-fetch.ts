
// This is a placeholder file for data fetching logic.
// In a real app, you would fetch data from a database or API.

const mockProducts = [
  { id: "P00001", name: "릴리 화이트 셔츠" },
  { id: "P00002", name: "맥 데님 팬츠" },
  { id: "P00003", name: "오렌지 포인트 스커트" },
  { id: "P00004", name: "그린 스트라이프 티" },
  { id: "P00005", name: "베이직 블랙 슬랙스" },
];

const mockMaterials = [
  { id: "M00001", name: "마르시아 장미" },
  { id: "M00002", name: "레드 카네이션" },
  { id: "M00003", name: "몬스테라" },
  { id: "M00004", name: "만천홍" },
  { id: "M00005", name: "포장용 크라프트지" },
];


export async function getItemData(id: string, type: 'product' | 'material') {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (type === 'product') {
    return mockProducts.find(p => p.id === id) || null;
  }
  if (type === 'material') {
    return mockMaterials.find(m => m.id === id) || null;
  }
  return null;
}
