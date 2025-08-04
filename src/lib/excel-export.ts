import * as XLSX from 'xlsx';

export interface ExportData {
  id: string;
  name: string;
  mainCategory: string;
  midCategory: string;
  price: number;
  supplier: string;
  stock: number;
  size: string;
  color: string;
  branch: string;
  code?: string;
  category?: string;
  status: string;
}

export const exportToExcel = (data: ExportData[], filename: string) => {
  // 데이터를 워크시트 형식으로 변환
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // 컬럼 너비 자동 조정
  const columnWidths = [
    { wch: 15 }, // id
    { wch: 30 }, // name
    { wch: 20 }, // mainCategory
    { wch: 20 }, // midCategory
    { wch: 12 }, // price
    { wch: 20 }, // supplier
    { wch: 10 }, // stock
    { wch: 15 }, // size
    { wch: 15 }, // color
    { wch: 20 }, // branch
    { wch: 15 }, // code
    { wch: 20 }, // category
    { wch: 15 }, // status
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // 파일 다운로드
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportFilteredData = (
  data: ExportData[], 
  filename: string, 
  filters: {
    branch?: string;
    category?: string;
    searchTerm?: string;
  }
) => {
  let filteredData = [...data];
  
  // 필터 적용
  if (filters.branch && filters.branch !== 'all') {
    filteredData = filteredData.filter(item => item.branch === filters.branch);
  }
  
  if (filters.category && filters.category !== 'all') {
    filteredData = filteredData.filter(item => item.mainCategory === filters.category);
  }
  
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filteredData = filteredData.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.code?.toLowerCase().includes(searchLower)
    );
  }
  
  // 내보내기 실행
  exportToExcel(filteredData, filename);
}; 