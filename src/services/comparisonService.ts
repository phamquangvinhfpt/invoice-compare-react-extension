// Định nghĩa các kiểu dữ liệu
export interface InvoiceItem {
  row: number;
  invoiceOriginal: string;
  seller: string;
  taxCode: string;  // Thêm trường mã số thuế
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
 * @param taxCodeCol - Cột chứa mã số thuế
 * @returns Đối tượng map chứa thông tin hóa đơn và mảng các hóa đơn trùng lặp
 */
export const extractInvoiceData = (
  data: any[][],
  startRow: number,
  invoiceCol: number,
  sellerCol: number,
  taxCodeCol: number
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
    
    // Xử lý số hóa đơn - loại bỏ tất cả số 0 đầu
    let invoiceNumber = String(row[invoiceCol]);
    let normalizedInvoice = invoiceNumber.replace(/^0+/, '') || '0'; // Nếu toàn số 0 thì giữ lại 1 số 0
    
    // Danh sách các công ty cần bỏ qua
    const removeCompanyName = ['CẢNG VỤ ĐƯỜNG THUỶ NỘI ĐỊA TP.HCM'];
    
    // Lấy tên người bán và mã số thuế
    const seller = row[sellerCol] || '';
    let taxCode = row[taxCodeCol] || '';
    
    // Kiểm tra xem tên người bán có thuộc danh sách cần bỏ qua không
    if (removeCompanyName.some(name => seller.toUpperCase().includes(name))) {
      console.log(`Bỏ qua hóa đơn từ công ty: ${seller}`);
      continue;
    }
    
    // Kiểm tra độ dài số hóa đơn sau khi chuẩn hóa (bỏ qua nếu > 8 ký tự)
    if (normalizedInvoice.length > 8) {
      console.log(`Bỏ qua hóa đơn có số dài: ${normalizedInvoice}`);
      continue;
    }
    
    // Kiểm tra mã số thuế trống
    if (!taxCode || String(taxCode).trim() === '') {
      console.log(`Bỏ qua hóa đơn thiếu mã số thuế: ${normalizedInvoice}`);
      continue;
    }

    // Xử lý đầu vào mst nếu có dấu ' vd: '0107500414 thì cắt dấu đó đi đồng thời cũng cắt đầu 0 ra luôn
    if (typeof taxCode === 'string' && taxCode.includes("'")) {
      taxCode = taxCode.split("'")[0].replace(/^0+/, '');
    } else if (typeof taxCode === 'number') {
      taxCode = String(taxCode).replace(/^0+/, '');
    }
    
    // Tạo một đối tượng InvoiceItem mới
    const invoiceItem: InvoiceItem = {
      row: i,
      invoiceOriginal: normalizedInvoice, // Sử dụng số đã loại bỏ số 0 đầu
      seller: seller,
      taxCode: taxCode,
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
  Object.entries(occurrences).forEach(([_signature, items]) => {
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
 * Kiểm tra xem hai bản ghi có giống hệt nhau không (bao gồm cả số hóa đơn và mã số thuế)
 * @param item1 - Bản ghi thứ nhất
 * @param item2 - Bản ghi thứ hai
 * @returns true nếu hai bản ghi giống hệt nhau
 */
export const areRecordsIdentical = (item1: InvoiceItem, item2: InvoiceItem): boolean => {
  if (!item1 || !item2) return false;
  
  const normalizedTaxCode1 = normalizeTaxCode(item1.taxCode);
  const normalizedTaxCode2 = normalizeTaxCode(item2.taxCode);
  
  return item1.invoiceOriginal === item2.invoiceOriginal && 
         normalizedTaxCode1 === normalizedTaxCode2;
};

/**
 * So sánh dữ liệu hóa đơn từ hai file
 * @param file1Data - Dữ liệu từ file 1
 * @param file2Data - Dữ liệu từ file 2
 * @param file1StartRow - Dòng bắt đầu của file 1
 * @param file1InvoiceCol - Cột số hóa đơn trong file 1
 * @param file1SellerCol - Cột tên người bán trong file 1
 * @param file1TaxCodeCol - Cột mã số thuế trong file 1
 * @param file2StartRow - Dòng bắt đầu của file 2
 * @param file2InvoiceCol - Cột số hóa đơn trong file 2
 * @param file2SellerCol - Cột tên người bán trong file 2
 * @param file2TaxCodeCol - Cột mã số thuế trong file 2
 * @returns Kết quả so sánh
 */
export const compareInvoiceData = (
  file1Data: any[][],
  file2Data: any[][],
  file1StartRow: number,
  file1InvoiceCol: number,
  file1SellerCol: number,
  file1TaxCodeCol: number,
  file2StartRow: number,
  file2InvoiceCol: number,
  file2SellerCol: number,
  file2TaxCodeCol: number
): ComparisonResult => {
  // Trích xuất dữ liệu từ cả hai file
  const file1Result = extractInvoiceData(file1Data, file1StartRow, file1InvoiceCol, file1SellerCol, file1TaxCodeCol);
  const file2Result = extractInvoiceData(file2Data, file2StartRow, file2InvoiceCol, file2SellerCol, file2TaxCodeCol);
  
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
    .flatMap(key => file1Invoices[key]);

  // Tìm các hóa đơn có trong file 2 nhưng không có trong file 1
  const missingInFile1 = file2Keys
    .filter(key => !file1Keys.includes(key) && isNumber(file2Invoices[key][0].invoiceOriginal))
    .flatMap(key => file2Invoices[key]);
  // Tìm các hóa đơn có số giống nhau nhưng mã số thuế khác nhau
  const mismatchedSellers: MismatchedSellerItem[] = [];
  
  file1Keys.forEach(key => {
    if (file2Keys.includes(key) && isNumber(key)) {
      const file1Items = file1Invoices[key];
      const file2Items = file2Invoices[key];
      
      // Kiểm tra xem có sự khác biệt về mã số thuế không
      const hasTaxCodeMismatch = file1Items.some(f1Item => 
        file2Items.some(f2Item => {
          const normalizedTaxCode1 = normalizeTaxCode(f1Item.taxCode);
          const normalizedTaxCode2 = normalizeTaxCode(f2Item.taxCode);
          return normalizedTaxCode1 !== normalizedTaxCode2 && 
                 normalizedTaxCode1.trim() !== '' && 
                 normalizedTaxCode2.trim() !== '';
        })
      );
      
      // Debug log
      if (hasTaxCodeMismatch) {
        console.log(`=== Phát hiện hóa đơn #${key} có mã số thuế không khớp ===`);
        file1Items.forEach(item => {
          console.log(`File1 [${item.position}]: "${item.taxCode}" → "${normalizeTaxCode(item.taxCode)}"`);
        });
        file2Items.forEach(item => {
          console.log(`File2 [${item.position}]: "${item.taxCode}" → "${normalizeTaxCode(item.taxCode)}"`);
        });
      }
      
      if (hasTaxCodeMismatch) {
        mismatchedSellers.push({
          key: key,
          file1: file1Items,
          file2: file2Items
        });
      }
    }
  });

  // Tìm các hóa đơn trùng lặp trong mỗi file
  const duplicatedInFile1 = findDuplicateInvoices(file1AllInvoices, true);
  const duplicatedInFile2 = findDuplicateInvoices(file2AllInvoices, false);
  
  // Kết hợp các hóa đơn trùng lặp
  const duplicatedItems = [...duplicatedInFile1, ...duplicatedInFile2];

  return {
    missingInFile1,
    missingInFile2,
    mismatchedSellers,
    duplicatedItems
  };
};

/**
 * Kiểm tra tính hợp lệ của dữ liệu đầu vào
 * @param invoiceCol - Cột số hóa đơn
 * @param invoiceRow - Dòng bắt đầu
 * @param sellerCol - Cột tên người bán
 * @param taxCodeCol - Cột mã số thuế
 * @param fileData - Dữ liệu file
 * @returns true nếu dữ liệu hợp lệ
 */
export const validateInput = (
  invoiceCol: number,
  invoiceRow: number,
  sellerCol: number,
  taxCodeCol: number,
  fileData: any[][]
): boolean => {
  // Kiểm tra dữ liệu đầu vào
  if (!fileData || !Array.isArray(fileData) || fileData.length === 0) {
    console.error('Dữ liệu file không hợp lệ');
    return false;
  }
  
  // Kiểm tra chỉ số cột và dòng
  if (invoiceCol < 0 || sellerCol < 0 || taxCodeCol < 0 || invoiceRow < 0) {
    console.error('Chỉ số cột hoặc dòng không hợp lệ');
    return false;
  }
  
  // Kiểm tra xem có đủ dữ liệu không
  if (fileData.length <= invoiceRow) {
    console.error('Không đủ dữ liệu trong file');
    return false;
  }
  
  // Kiểm tra xem các cột có tồn tại không
  const firstRow = fileData[invoiceRow];
  if (!firstRow || !Array.isArray(firstRow)) {
    console.error('Dữ liệu dòng không hợp lệ');
    return false;
  }
  
  if (invoiceCol >= firstRow.length || sellerCol >= firstRow.length || taxCodeCol >= firstRow.length) {
    console.error('Chỉ số cột vượt quá kích thước dữ liệu');
    return false;
  }
  
  return true;
};

/**
 * Chuẩn hóa mã số thuế
 * @param taxCode - Mã số thuế cần chuẩn hóa
 * @returns Mã số thuế đã chuẩn hóa
 */
export const normalizeTaxCode = (taxCode: string | undefined): string => {
  if (!taxCode) return '';
  
  // Loại bỏ khoảng trắng và chuyển về chữ thường
  let normalized = String(taxCode).trim().toLowerCase();
  
  // Nếu có dấu gạch ngang, chỉ lấy phần trước dấu gạch
  if (normalized.includes('-')) {
    normalized = normalized.split('-')[0];
  }
  
  // Loại bỏ các ký tự không phải số
  normalized = normalized.replace(/[^0-9]/g, '');
  
  return normalized;
};