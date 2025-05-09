// Định nghĩa các kiểu dữ liệu
export interface InvoiceItem {
  row: number;
  invoiceOriginal: string;
  seller: string;
  position: any;
}

export interface InvoiceMap {
  [key: string]: InvoiceItem;
}

export interface MismatchedSellerItem {
  key: string;
  file1: InvoiceItem;
  file2: InvoiceItem;
}

export interface ComparisonResult {
  missingInFile1: InvoiceItem[];
  missingInFile2: InvoiceItem[];
  mismatchedSellers: MismatchedSellerItem[];
}

/**
 * Trích xuất dữ liệu hóa đơn từ mảng dữ liệu
 * @param data - Dữ liệu từ file Excel
 * @param startRow - Dòng bắt đầu
 * @param invoiceCol - Cột chứa số hóa đơn
 * @param sellerCol - Cột chứa tên người bán
 * @returns Đối tượng map chứa thông tin hóa đơn
 */
export const extractInvoiceData = (
  data: any[][],
  startRow: number,
  invoiceCol: number,
  sellerCol: number
): InvoiceMap => {
  const result: InvoiceMap = {};
  let processedCount = 0;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    if (!row || !Array.isArray(row)) {
      // console.log(`Bỏ qua dòng ${i + 1}: không phải mảng`);
      continue;
    }
    
    // Kiểm tra có giá trị tại cột hóa đơn không
    const invoiceValue = row[invoiceCol];
    if (invoiceValue === undefined || invoiceValue === null || invoiceValue === '') {
      // console.log(`Bỏ qua dòng ${i + 1}: không có số hóa đơn`);
      continue;
    }
    
    processedCount++;
    
    // Xử lý số hóa đơn (giữ nguyên giá trị gốc để hiển thị)
    let invoiceNumber = row[invoiceCol];
    let normalizedInvoice = String(invoiceNumber);
    
    // Loại bỏ số 0 đằng trước cho mục đích so sánh nếu là số
    if (/^\d+$/.test(normalizedInvoice)) {
      normalizedInvoice = normalizedInvoice.replace(/^0+/, '');
    }
    
    // Lấy tên người bán
    const seller = row[sellerCol] || '';
    
    // Thêm vào kết quả, sử dụng dạng chuẩn hóa làm khóa
    result[normalizedInvoice] = {
      row: i,
      invoiceOriginal: String(invoiceNumber), // Giữ dạng gốc cho hiển thị
      seller: seller,
      position: row[0] || (i + 1) // Lưu lại vị trí của hàng trong file, mặc định là số thứ tự dòng
    };
  }
  
  // console.log(`Đã xử lý ${processedCount} dòng, có ${Object.keys(result).length} hóa đơn hợp lệ`);
  return result;
};

/**
 * Hàm chuẩn hóa tên người bán
 * @param sellerName - Tên người bán
 * @returns Tên đã chuẩn hóa
 */
export const standardizeSeller = (sellerName: string | undefined): string => {
  if (!sellerName) return '';
  
  // Bỏ dấu tiếng Việt
  const removeDiacritics = (str: string): string => {
    return str.normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '')
             .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };
  
  // Cắt lấy 3 từ cuối của tên người bán
  const words = sellerName.trim().split(/\s+/);
  const lastThreeWords = words.length <= 3 ? words : words.slice(-3);
  const processedName = lastThreeWords.join(' ').toLowerCase();
  
  // Trả về tên đã chuẩn hóa: không dấu, lowercase
  return removeDiacritics(processedName);
};

/**
 * So sánh dữ liệu hóa đơn từ hai file
 * @param file1Invoices - Dữ liệu hóa đơn từ file 1
 * @param file2Invoices - Dữ liệu hóa đơn từ file 2
 * @returns Kết quả so sánh
 */
export const compareInvoiceData = (
  file1Invoices: InvoiceMap,
  file2Invoices: InvoiceMap
): ComparisonResult => {
  const file1Keys = Object.keys(file1Invoices);
  const file2Keys = Object.keys(file2Invoices);
  
  console.log("So sánh:", file1Keys.length, "hóa đơn từ file 1 với", file2Keys.length, "hóa đơn từ file 2");
  
  // Tìm các hóa đơn có trong file 1 nhưng không có trong file 2
  const missingInFile2 = file1Keys
    .filter(key => !file2Keys.includes(key))
    .map(key => ({
      row: file1Invoices[key].row,
      invoiceOriginal: file1Invoices[key].invoiceOriginal,
      seller: file1Invoices[key].seller,
      position: file1Invoices[key].position
    }));
  
  // Tìm các hóa đơn có trong file 2 nhưng không có trong file 1
  const missingInFile1 = file2Keys
    .filter(key => !file1Keys.includes(key))
    .map(key => ({
      row: file2Invoices[key].row,
      invoiceOriginal: file2Invoices[key].invoiceOriginal,
      seller: file2Invoices[key].seller,
      position: file2Invoices[key].position
    }));
  
  // Tìm các hóa đơn có cùng số nhưng tên người bán khác nhau
  const mismatchedSellers = file1Keys
    .filter(key => {
      if (!file2Keys.includes(key)) return false;
      
      const seller1Standardized = standardizeSeller(file1Invoices[key].seller);
      const seller2Standardized = standardizeSeller(file2Invoices[key].seller);
      
      // So sánh tên đã chuẩn hóa
      return seller1Standardized !== seller2Standardized;
    })
    .map(key => ({
      key: key,
      file1: {
        seller: file1Invoices[key].seller,
        row: file1Invoices[key].row,
        invoiceOriginal: file1Invoices[key].invoiceOriginal,
        position: file1Invoices[key].position
      },
      file2: {
        seller: file2Invoices[key].seller,
        row: file2Invoices[key].row,
        invoiceOriginal: file2Invoices[key].invoiceOriginal,
        position: file2Invoices[key].position
      }
    }));
  
  return {
    missingInFile1,
    missingInFile2,
    mismatchedSellers
  };
};

/**
 * Kiểm tra tính hợp lệ của dữ liệu đầu vào
 * @param invoiceCol - Cột chứa số hóa đơn
 * @param invoiceRow - Dòng bắt đầu
 * @param sellerCol - Cột chứa tên người bán
 * @param fileData - Dữ liệu file
 * @returns true nếu dữ liệu hợp lệ
 */
export const validateInput = (
  invoiceCol: number,
  invoiceRow: number,
  sellerCol: number,
  fileData: any[][]
): boolean => {
  if (invoiceCol < 0 || invoiceRow < 0 || sellerCol < 0) {
    return false;
  }
  
  if (!fileData || fileData.length <= invoiceRow) {
    return false;
  }
  
  // Kiểm tra số cột trong dữ liệu
  const maxCols = Math.max(
    ...fileData.slice(invoiceRow).map(row => Array.isArray(row) ? row.length : 0)
  );
  
  if (maxCols <= invoiceCol || maxCols <= sellerCol) {
    return false;
  }
  
  return true;
};
