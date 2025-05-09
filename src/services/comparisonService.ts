// Định nghĩa các kiểu dữ liệu
export interface InvoiceItem {
  row: number;
  invoiceOriginal: string;
  seller: string;
  position: any;
}

export interface InvoiceMap {
  [key: string]: InvoiceItem[];
}

export interface MismatchedSellerItem {
  key: string;
  file1: InvoiceItem[];
  file2: InvoiceItem[];
}

export interface ComparisonResult {
  missingInFile1: InvoiceItem[];
  missingInFile2: InvoiceItem[];
  mismatchedSellers: MismatchedSellerItem[];
  duplicatedItems: DuplicatedItem[]; // Thêm trường mới cho các mục trùng lặp
}

// Thêm interface mới cho các mục trùng lặp
export interface DuplicatedItem {
  key: string;           // Khóa (số hóa đơn chuẩn hóa)
  file1: InvoiceItem | null;    // Thông tin từ file 1
  file2: InvoiceItem | null;    // Thông tin từ file 2
  isDuplicate: boolean;  // Đánh dấu là mục trùng lặp
}

/**
 * Trích xuất dữ liệu hóa đơn từ mảng dữ liệu
 * @param data - Dữ liệu từ file Excel
 * @param startRow - Dòng bắt đầu
 * @param invoiceCol - Cột chứa số hóa đơn
 * @param sellerCol - Cột chứa tên người bán
 * @returns Đối tượng map chứa thông tin hóa đơn và mảng các hóa đơn trùng lặp
 */
export const extractInvoiceData = (
  data: any[][],
  startRow: number,
  invoiceCol: number,
  sellerCol: number
): { invoiceMap: InvoiceMap; allInvoices: InvoiceItem[] } => {
  const result: InvoiceMap = {};
  const allInvoices: InvoiceItem[] = [];
  let processedCount = 0;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    if (!row || !Array.isArray(row)) {
      continue;
    }
    
    // Kiểm tra có giá trị tại cột hóa đơn không
    const invoiceValue = row[invoiceCol];
    if (invoiceValue === undefined || invoiceValue === null || invoiceValue === '') {
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
    
    // Tạo một đối tượng InvoiceItem mới
    const invoiceItem: InvoiceItem = {
      row: i,
      invoiceOriginal: String(invoiceNumber), // Giữ dạng gốc cho hiển thị
      seller: seller,
      position: row[0] || (i + 1) // Lưu lại vị trí của hàng trong file, mặc định là số thứ tự dòng
    };
    
    // Thêm vào danh sách tất cả hóa đơn
    allInvoices.push(invoiceItem);
    
    // Thêm vào map theo số hóa đơn (giờ mỗi key sẽ lưu một mảng các hóa đơn)
    if (!result[normalizedInvoice]) {
      result[normalizedInvoice] = [];
    }
    result[normalizedInvoice].push(invoiceItem);
  }
  
  console.log(`Đã xử lý ${processedCount} dòng, có ${Object.keys(result).length} số hóa đơn duy nhất và ${allInvoices.length} hóa đơn tổng cộng`);
  
  return { invoiceMap: result, allInvoices };
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
 * Tạo chuỗi định danh duy nhất từ tất cả thông tin của hóa đơn để so sánh
 * @param invoice - Đối tượng hóa đơn
 * @returns Chuỗi định danh
 */
export const createInvoiceSignature = (invoice: InvoiceItem): string => {
  // Kết hợp tất cả thông tin của hóa đơn thành một chuỗi duy nhất
  return `${invoice.invoiceOriginal}-${invoice.seller}-${invoice.position}`;
};

/**
 * Tìm các hóa đơn trùng lặp trong một file (hoàn toàn giống nhau)
 * @param allInvoices - Mảng tất cả hóa đơn
 * @param isFile1 - Đánh dấu là từ file 1 hay không (để phân biệt nguồn)
 * @returns Mảng các hóa đơn trùng lặp
 */
export const findDuplicateInvoices = (
  allInvoices: InvoiceItem[],
  isFile1: boolean = true
): DuplicatedItem[] => {
  const duplicatedItems: DuplicatedItem[] = [];
  
  // Tạo map để đếm số lần xuất hiện của mỗi hóa đơn dựa trên toàn bộ thông tin
  const occurrences: Record<string, InvoiceItem[]> = {};
  
  // Đếm số lần xuất hiện của mỗi hóa đơn (dựa trên chữ ký duy nhất)
  allInvoices.forEach(invoice => {
    const signature = createInvoiceSignature(invoice);
    
    if (!occurrences[signature]) {
      occurrences[signature] = [];
    }
    
    occurrences[signature].push(invoice);
  });
  
  // Kiểm tra các hóa đơn xuất hiện nhiều lần
  Object.entries(occurrences).forEach(([signature, items]) => {
    // Nếu có nhiều hơn 1 bản ghi giống hệt nhau
    if (items.length > 1 && items.every(item => isNumber(item.invoiceOriginal))) {
      // Thêm vào danh sách trùng lặp
      items.forEach(item => {
        duplicatedItems.push({
          key: item.invoiceOriginal,
          file1: isFile1 ? item : null,
          file2: isFile1 ? null : item,
          isDuplicate: true
        });
      });
      
      console.log(`File ${isFile1 ? '1' : '2'}: Tìm thấy ${items.length} bản ghi trùng lặp hoàn toàn cho hóa đơn ${items[0].invoiceOriginal} - ${items[0].seller}`);
    }
  });
  
  console.log(`Tổng cộng: ${duplicatedItems.length} hóa đơn trùng lặp hoàn toàn trong file ${isFile1 ? '1' : '2'}`);
  
  return duplicatedItems;
};

/**
 * Kiểm tra một giá trị có phải là số hợp lệ hay không
 * @param value - Giá trị cần kiểm tra
 * @returns true nếu là số hợp lệ
 */
export const isNumber = (value: any): boolean => {
  // Kiểm tra chuỗi rỗng hoặc null/undefined
  if (value === undefined || value === null || value === '') {
    return false;
  }
  
  // Chuyển đổi sang chuỗi nếu chưa phải
  const str = String(value);
  
  // Kiểm tra chuỗi có chứa ký tự số hay không
  return /^\d+$/.test(str.trim());
};

/**
 * Kiểm tra xem hai bản ghi có giống hệt nhau không (bao gồm cả số hóa đơn và người bán)
 * @param item1 - Bản ghi thứ nhất
 * @param item2 - Bản ghi thứ hai
 * @returns true nếu hai bản ghi giống hệt nhau
 */
export const areRecordsIdentical = (item1: InvoiceItem, item2: InvoiceItem): boolean => {
  if (!item1 || !item2) return false;
  
  return item1.invoiceOriginal === item2.invoiceOriginal && 
         item1.seller === item2.seller;
};

/**
 * So sánh dữ liệu hóa đơn từ hai file
 * @param file1Invoices - Dữ liệu hóa đơn từ file 1
 * @param file2Invoices - Dữ liệu hóa đơn từ file 2
 * @returns Kết quả so sánh
 */
export const compareInvoiceData = (
  file1Data: any[][],
  file2Data: any[][],
  file1StartRow: number,
  file1InvoiceCol: number,
  file1SellerCol: number,
  file2StartRow: number,
  file2InvoiceCol: number,
  file2SellerCol: number
): ComparisonResult => {
  // Trích xuất dữ liệu từ cả hai file, bao gồm tất cả hóa đơn (kể cả trùng lặp)
  const file1Result = extractInvoiceData(file1Data, file1StartRow, file1InvoiceCol, file1SellerCol);
  const file2Result = extractInvoiceData(file2Data, file2StartRow, file2InvoiceCol, file2SellerCol);
  
  const file1Invoices = file1Result.invoiceMap;
  const file2Invoices = file2Result.invoiceMap;
  const file1AllInvoices = file1Result.allInvoices;
  const file2AllInvoices = file2Result.allInvoices;
  
  const file1Keys = Object.keys(file1Invoices);
  const file2Keys = Object.keys(file2Invoices);

  console.log("Số hóa đơn từ file 1:", file1Keys.length);
  
  console.log("So sánh:", file1Keys.length, "số hóa đơn từ file 1 với", file2Keys.length, "số hóa đơn từ file 2");
  
  // Tìm các hóa đơn có trong file 1 nhưng không có trong file 2
  const missingInFile2 = file1Keys
    .filter(key => !file2Keys.includes(key) && isNumber(file1Invoices[key][0].invoiceOriginal))
    .flatMap(key => file1Invoices[key].map(invoice => ({
      row: invoice.row,
      invoiceOriginal: invoice.invoiceOriginal,
      seller: invoice.seller,
      position: invoice.position
    })));
  
  // Tìm các hóa đơn có trong file 2 nhưng không có trong file 1
  const missingInFile1 = file2Keys
    .filter(key => !file1Keys.includes(key) && isNumber(file2Invoices[key][0].invoiceOriginal))
    .flatMap(key => file2Invoices[key].map(invoice => ({
      row: invoice.row,
      invoiceOriginal: invoice.invoiceOriginal,
      seller: invoice.seller,
      position: invoice.position
    })));
  
  // Tìm các hóa đơn có cùng số nhưng tên người bán khác nhau
  const mismatchedSellers: MismatchedSellerItem[] = file1Keys
    .filter(key => file2Keys.includes(key))
    .filter(key => {
      // Kiểm tra xem có bất kỳ sự khác biệt nào giữa người bán từ file1 và file2
      const file1Sellers = file1Invoices[key].map(inv => standardizeSeller(inv.seller));
      const file2Sellers = file2Invoices[key].map(inv => standardizeSeller(inv.seller));
      
      // So sánh các tập hợp người bán
      const allSellers = new Set([...file1Sellers, ...file2Sellers]);
      
      // Log để kiểm tra
      console.log(`So sánh hóa đơn ${key}: File1 có ${file1Invoices[key].length} mục, File2 có ${file2Invoices[key].length} mục`);
      file1Invoices[key].forEach(inv => {
        console.log(`  File1: ${inv.position}, ${inv.seller}`);
      });
      file2Invoices[key].forEach(inv => {
        console.log(`  File2: ${inv.position}, ${inv.seller}`);
      });
      
      // Nếu có nhiều người bán khác nhau, có sự không khớp
      return allSellers.size > 1;
    })
    .map(key => ({
      key: key,
      file1: file1Invoices[key].map(inv => ({
        seller: inv.seller,
        row: inv.row,
        invoiceOriginal: inv.invoiceOriginal,
        position: inv.position
      })),
      file2: file2Invoices[key].map(inv => ({
        seller: inv.seller,
        row: inv.row,
        invoiceOriginal: inv.invoiceOriginal,
        position: inv.position
      }))
    }));
  
  // Tìm các hóa đơn trùng lặp trong mỗi file
  const duplicatesInFile1 = findDuplicateInvoices(file1AllInvoices, true);
  const duplicatesInFile2 = findDuplicateInvoices(file2AllInvoices, false);
  
  // Gộp các hóa đơn trùng lặp từ cả hai file
  const duplicatedItems: DuplicatedItem[] = [...duplicatesInFile1, ...duplicatesInFile2];
  
  return {
    missingInFile1,
    missingInFile2,
    mismatchedSellers,
    duplicatedItems
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