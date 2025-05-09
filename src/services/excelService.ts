import { Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Các màu highlight
export const MISSING_INVOICE_COLOR = 'FFFF9999'; // Màu đỏ nhạt
export const MISMATCHED_SELLER_COLOR = 'e9c46a'; // Màu vàng nhạt
export const DUPLICATED_INVOICE_COLOR = 'FFA8D1FF'; // Màu tím nhạt cho hóa đơn trùng lặp

/**
 * Đọc file Excel từ ArrayBuffer
 * @param buffer - Dữ liệu file Excel 
 * @returns Promise với workbook
 */
export const readExcelFile = async (buffer: ArrayBuffer): Promise<Workbook> => {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

/**
 * Chuyển đổi dữ liệu Excel thành mảng 2 chiều
 * @param workbook - Workbook cần chuyển đổi
 * @returns Mảng 2 chiều dữ liệu 
 */
export const workbookToArray = (workbook: Workbook): any[][] => {
  const worksheet = workbook.worksheets[0];
  const data: any[][] = [];
  
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowData: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowData[colNumber - 1] = cell.value;
    });
    data[rowNumber - 1] = rowData;
  });
  
  return data;
};

/**
 * Highlight một hàng trong worksheet
 * @param worksheet - Worksheet cần highlight
 * @param rowIndex - Chỉ số hàng (1-based trong exceljs)
 * @param colorHex - Mã màu hex (không có #) ví dụ: 'FFFF9999'
 */
export const highlightRow = (worksheet: Worksheet, rowIndex: number, colorHex: string): void => {
  try {
    // Đảm bảo rowIndex là 1-based (ExcelJS sử dụng 1-based indexing)
    const row = worksheet.getRow(rowIndex);
    
    // Kiểm tra xem hàng có tồn tại không
    if (!row) {
      console.warn(`Không tìm thấy hàng ${rowIndex}`);
      return;
    }
    
    // Xác định số cột có dữ liệu thực sự
    const maxCol = worksheet.columnCount || 25; // Mặc định 25 cột nếu không xác định được
    // Duyệt qua từng ô trong hàng và chỉ highlight các ô có giá trị
    for (let colIndex = 1; colIndex <= maxCol; colIndex++) {
      const cell = row.getCell(colIndex);
      // Kiểm tra xem ô có giá trị hay không (khác null, undefined và chuỗi rỗng)
      const cellValue = cell.value;
      const hasValue = cellValue !== null && cellValue !== undefined && 
                    !(typeof cellValue === 'string' && cellValue.trim() === '');
      
      if (hasValue) {
        // Lưu lại style hiện tại của cell
        const existingStyle = Object.assign({}, cell.style || {});
        
        // Thêm fill với màu được chỉ định
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorHex }
        };
        
        // Giữ lại các style khác
        if (existingStyle.font) cell.font = existingStyle.font;
        if (existingStyle.border) cell.border = existingStyle.border;
        if (existingStyle.alignment) cell.alignment = existingStyle.alignment;
        if (existingStyle.protection) cell.protection = existingStyle.protection;
      }
    }

    // Lưu thay đổi
    row.commit();
  } catch (error) {
    console.error(`Lỗi khi highlight hàng ${rowIndex}:`, error);
  }
};

/**
 * Thêm chú thích màu highlight vào worksheet
 * @param worksheet - Worksheet cần thêm chú thích
 */
export const addLegend = (worksheet: Worksheet): void => {
  try {
    // Tìm dòng cuối có dữ liệu
    let lastRowNum = worksheet.lastRow ? worksheet.lastRow.number : 1;
    lastRowNum += 2; // Thêm 2 dòng trống

    // Thêm tiêu đề chú thích
    const titleRow = worksheet.getRow(lastRowNum);
    const titleCell = titleRow.getCell(1);
    titleCell.value = 'Chú thích:';
    titleCell.font = { bold: true };
    titleRow.commit();

    // Thêm chú thích màu đỏ
    const redRow = worksheet.getRow(lastRowNum + 1);
    const redCell = redRow.getCell(1);
    redCell.value = 'Màu đỏ: Hóa đơn thiếu';
    redCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: MISSING_INVOICE_COLOR }
    };
    redRow.commit();

    // Thêm chú thích màu vàng
    const yellowRow = worksheet.getRow(lastRowNum + 2);
    const yellowCell = yellowRow.getCell(1);
    yellowCell.value = 'Màu vàng: Người bán không khớp';
    yellowCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: MISMATCHED_SELLER_COLOR }
    };
    yellowRow.commit();
    
    // Thêm chú thích màu tím
    const purpleRow = worksheet.getRow(lastRowNum + 3);
    const purpleCell = purpleRow.getCell(1);
    purpleCell.value = 'Màu tím: Hóa đơn trùng lặp';
    purpleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: DUPLICATED_INVOICE_COLOR }
    };
    purpleRow.commit();
  } catch (error) {
    console.error("Lỗi khi thêm chú thích:", error);
  }
};

/**
 * Highlight các dòng có vấn đề trong file Excel
 * @param workbook - Workbook cần highlight
 * @param missingRows - Mảng các chỉ số hàng thiếu
 * @param mismatchRows - Mảng các chỉ số hàng không khớp người bán
 * @param duplicatedRows - Mảng các chỉ số hàng trùng lặp
 * @param worksheetIndex - Chỉ số của worksheet (0-based)
 */
export const highlightProblemRows = (
  workbook: Workbook, 
  missingRows: number[], 
  mismatchRows: number[], 
  duplicatedRows: number[] = [],
  worksheetIndex: number = 0
): void => {
  const worksheet = workbook.worksheets[worksheetIndex];
  
  // Debug: In ra số lượng hàng ban đầu có màu đỏ
  console.log("===== TRẠNG THÁI BAN ĐẦU =====");
  const initialColoredRows = new Set<number>();
  worksheet.eachRow((row, rowNum) => {
    let hasColor = false;
    row.eachCell((cell) => {
      if (cell.fill && cell.fill.type === 'pattern' && 
          cell.fill.pattern === 'solid' && 
          cell.fill.fgColor && cell.fill.fgColor.argb === MISSING_INVOICE_COLOR) {
        hasColor = true;
      }
    });
    if (hasColor) initialColoredRows.add(rowNum);
  });
  console.log(`Ban đầu có ${initialColoredRows.size} hàng đã có màu đỏ`);
  
  // Xử lý loại bỏ giá trị trùng lặp và không hợp lệ
  const uniqueMissingRows = Array.isArray(missingRows) ? 
    [...new Set(missingRows.filter(rowIdx => rowIdx !== undefined && rowIdx !== null))] : [];
    
  const uniqueMismatchRows = Array.isArray(mismatchRows) ? 
    [...new Set(mismatchRows.filter(rowIdx => rowIdx !== undefined && rowIdx !== null))] : [];

  const uniqueDuplicatedRows = Array.isArray(duplicatedRows) ?
    [...new Set(duplicatedRows.filter(rowIdx => rowIdx !== undefined && rowIdx !== null))] : [];
  
  console.log('=== HIGHLIGHT DEBUG INFO ===');
  console.log('Worksheet:', worksheet.name);
  console.log('Missing rows count:', uniqueMissingRows.length);
  console.log('Missing rows indices:', JSON.stringify(uniqueMissingRows));
  console.log('Mismatch rows count:', uniqueMismatchRows.length);
  console.log('Mismatch rows indices:', JSON.stringify(uniqueMismatchRows));
  console.log('Duplicated rows count:', uniqueDuplicatedRows.length);
  console.log('Duplicated rows indices:', JSON.stringify(uniqueDuplicatedRows));
  
  // Highlight các hàng thiếu
  if (uniqueMissingRows.length > 0) {
    console.log(`Highlight ${uniqueMissingRows.length} hàng thiếu`);
    uniqueMissingRows.forEach(rowIdx => {
      // Convert from 0-based to 1-based indexing
      const excelRowIndex = rowIdx + 1;
      console.log(`Highlighting missing row at index: ${rowIdx} (Excel row: ${excelRowIndex})`);
      safeHighlightRow(worksheet, excelRowIndex, MISSING_INVOICE_COLOR);
    });
  }
  
  // Highlight các hàng không khớp
  if (uniqueMismatchRows.length > 0) {
    console.log(`Highlight ${uniqueMismatchRows.length} hàng không khớp người bán`);
    uniqueMismatchRows.forEach(rowIdx => {
      // Convert from 0-based to 1-based indexing
      const excelRowIndex = rowIdx + 1;
      console.log(`Highlighting mismatched row at index: ${rowIdx} (Excel row: ${excelRowIndex})`);
      safeHighlightRow(worksheet, excelRowIndex, MISMATCHED_SELLER_COLOR);
    });
  }

  // Highlight các hàng trùng lặp
  if (uniqueDuplicatedRows.length > 0) {
    console.log(`Highlight ${uniqueDuplicatedRows.length} hàng trùng lặp`);
    uniqueDuplicatedRows.forEach(rowIdx => {
      // Convert from 0-based to 1-based indexing
      const excelRowIndex = rowIdx + 1;
      console.log(`Highlighting duplicated row at index: ${rowIdx} (Excel row: ${excelRowIndex})`);
      safeHighlightRow(worksheet, excelRowIndex, DUPLICATED_INVOICE_COLOR);
    });
  }

  // Debug: Kiểm tra sau khi highlight
  console.log("===== TRẠNG THÁI SAU KHI HIGHLIGHT =====");
  const finalColoredRows = new Set<number>();
  worksheet.eachRow((row, rowNum) => {
    let hasColor = false;
    row.eachCell((cell) => {
      if (cell.fill && cell.fill.type === 'pattern' && 
          cell.fill.pattern === 'solid' && 
          (cell.fill.fgColor?.argb === MISSING_INVOICE_COLOR || 
           cell.fill.fgColor?.argb === MISMATCHED_SELLER_COLOR ||
           cell.fill.fgColor?.argb === DUPLICATED_INVOICE_COLOR)) {
        hasColor = true;
      }
    });
    if (hasColor) finalColoredRows.add(rowNum);
  });
  console.log(`Sau khi highlight có ${finalColoredRows.size} hàng có màu`);
  
  // Kiểm tra hàng không nằm trong danh sách nhưng bị highlight
  const expectedHighlightRows = new Set([
    ...uniqueMissingRows.map(idx => idx + 1),
    ...uniqueMismatchRows.map(idx => idx + 1),
    ...uniqueDuplicatedRows.map(idx => idx + 1)
  ]);
  
  const unexpectedHighlightRows = [...finalColoredRows].filter(rowNum => 
    !initialColoredRows.has(rowNum) && !expectedHighlightRows.has(rowNum)
  );
  
  if (unexpectedHighlightRows.length > 0) {
    console.error(`CẢNH BÁO: Có ${unexpectedHighlightRows.length} hàng không nằm trong danh sách nhưng bị highlight`);
    console.error(`Các hàng bị ảnh hưởng: ${unexpectedHighlightRows.join(', ')}`);
  }

  // Thêm chú thích về màu highlight
  addLegend(worksheet);
};

/**
 * Lưu workbook thành file Excel
 * @param workbook - Workbook cần lưu
 * @param fileName - Tên file
 */
export const saveWorkbook = async (workbook: Workbook, fileName: string): Promise<void> => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};

/**
 * Tạo và tải file zip chứa các file Excel đã highlight
 * @param file1Workbook - Workbook của file 1
 * @param file2Workbook - Workbook của file 2
 * @param file1Name - Tên file 1
 * @param file2Name - Tên file 2
 * @param missingInFile1 - Các dòng thiếu trong file 1
 * @param missingInFile2 - Các dòng thiếu trong file 2
 * @param mismatchedRows - Các dòng không khớp người bán
 */
export const createAndDownloadZip = async (
  file1Workbook: Workbook,
  file2Workbook: Workbook,
  file1Name: string,
  file2Name: string,
  missingInFile1: number[],
  missingInFile2: number[],
  mismatchedRowsFile1: number[],
  mismatchedRowsFile2: number[],
  duplicatedRowsFile1: number[] = [],
  duplicatedRowsFile2: number[] = []
): Promise<void> => {
  const zip = new JSZip();
  
  // Thêm log để debug
  console.log('=== ZIP DEBUG INFO ===');
  console.log('File 1 Name:', file1Name);
  console.log('File 2 Name:', file2Name);
  console.log('Missing in File 1 (rows to highlight in File 2):', missingInFile1);
  console.log('Missing in File 2 (rows to highlight in File 1):', missingInFile2);
  console.log('Mismatched in File 1:', mismatchedRowsFile1);
  console.log('Mismatched in File 2:', mismatchedRowsFile2);
  console.log('Duplicated in File 1:', duplicatedRowsFile1);
  console.log('Duplicated in File 2:', duplicatedRowsFile2);
  console.log('======================');
  
  // Clone workbook 1 và highlight
  // File 1 chỉ highlight những hóa đơn "có trong File 1 nhưng không có trong File 2" (missingInFile2)
  // và những hóa đơn có người bán không khớp
  const file1Buffer = await file1Workbook.xlsx.writeBuffer();
  const clonedWorkbook1 = new Workbook();
  await clonedWorkbook1.xlsx.load(file1Buffer);
  
  console.log('Highlighting File 1...');
  highlightProblemRows(clonedWorkbook1, missingInFile2, mismatchedRowsFile1, duplicatedRowsFile1, 0);
  
  // Clone workbook 2 và highlight
  // File 2 chỉ highlight những hóa đơn "có trong File 2 nhưng không có trong File 1" (missingInFile1)
  // và những hóa đơn có người bán không khớp
  const file2Buffer = await file2Workbook.xlsx.writeBuffer();
  const clonedWorkbook2 = new Workbook();
  await clonedWorkbook2.xlsx.load(file2Buffer);
  
  console.log('Highlighting File 2...');
  highlightProblemRows(clonedWorkbook2, missingInFile1, mismatchedRowsFile2, duplicatedRowsFile2, 0);
  
  // Tạo tên file
  const file1Parts = file1Name.split('.');
  const file1Ext = file1Parts.pop() || 'xlsx';
  const file1NameHighlighted = `${file1Parts.join('.')}_highlighted.${file1Ext}`;
  
  const file2Parts = file2Name.split('.');
  const file2Ext = file2Parts.pop() || 'xlsx';
  const file2NameHighlighted = `${file2Parts.join('.')}_highlighted.${file2Ext}`;
  
  // Thêm files vào zip
  const buffer1 = await clonedWorkbook1.xlsx.writeBuffer();
  const buffer2 = await clonedWorkbook2.xlsx.writeBuffer();
  
  zip.file(file1NameHighlighted, buffer1);
  zip.file(file2NameHighlighted, buffer2);
  
  // Thêm readme với số lượng hàng được highlight
  const readme = `THÔNG TIN CÁC FILE HIGHLIGHT

1. File: ${file1NameHighlighted}
   - Màu đỏ: Hóa đơn có trong File 1 nhưng không có trong File 2 (${Array.isArray(missingInFile2) ? missingInFile2.length : 0} hàng)
   - Màu vàng: Số hóa đơn khớp nhưng người bán không khớp (${Array.isArray(mismatchedRowsFile1) ? mismatchedRowsFile1.length : 0} hàng)
   - Màu tím: Hóa đơn trùng lặp trong File 1 (${Array.isArray(duplicatedRowsFile1) ? duplicatedRowsFile1.length : 0} hàng)

2. File: ${file2NameHighlighted}
   - Màu đỏ: Hóa đơn có trong File 2 nhưng không có trong File 1 (${Array.isArray(missingInFile1) ? missingInFile1.length : 0} hàng)
   - Màu vàng: Số hóa đơn khớp nhưng người bán không khớp (${Array.isArray(mismatchedRowsFile2) ? mismatchedRowsFile2.length : 0} hàng)
   - Màu tím: Hóa đơn trùng lặp trong File 2 (${Array.isArray(duplicatedRowsFile2) ? duplicatedRowsFile2.length : 0} hàng)

Ghi chú: Chỉ những ô có giá trị mới được highlight.`;
  
  zip.file("readme.txt", readme);
  
  // Tạo và tải xuống zip
  const now = new Date();
  const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}`;
  const zipFileName = `ket_qua_so_sanh_${dateStr}.zip`;
  
  console.log('Tạo file ZIP:', zipFileName);
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, zipFileName);
  console.log('Đã tạo xong file ZIP!');
};

export const safeHighlightRow = (worksheet: Worksheet, rowIndex: number, colorHex: string): void => {
  try {
    // Mặc định chỉ xử lý các cột từ 1-20 để tránh xử lý quá nhiều cột
    const maxProcessColumns = 20;
    
    console.log(`Highlight an toàn hàng ${rowIndex} với màu ${colorHex}`);
    
    // Lấy dữ liệu của hàng
    const sourceRow = worksheet.getRow(rowIndex);
    const cellsWithData: {col: number, value: any}[] = [];
    
    // Chỉ ghi nhận các ô có dữ liệu
    sourceRow.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum <= maxProcessColumns) {
        const value = cell.value;
        if (value !== null && value !== undefined && 
            !(typeof value === 'string' && value.trim() === '')) {
          cellsWithData.push({ col: colNum, value });
        }
      }
    });
    
    console.log(`Hàng ${rowIndex} có ${cellsWithData.length} ô có dữ liệu`);
    
    // Xử lý từng ô riêng biệt
    cellsWithData.forEach(cellInfo => {
      // Tạo ô mới với style mới
      const cell = worksheet.getCell(rowIndex, cellInfo.col);
      
      // Lưu lại style hiện tại
      const oldFont = cell.font ? { ...cell.font } : undefined;
      const oldAlignment = cell.alignment ? { ...cell.alignment } : undefined;
      const oldBorder = cell.border ? { ...cell.border } : undefined;
      
      // Áp dụng màu mới
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorHex }
      };
      
      // Khôi phục style cũ
      if (oldFont) cell.font = oldFont;
      if (oldAlignment) cell.alignment = oldAlignment;
      if (oldBorder) cell.border = oldBorder;
      
      console.log(`  Đã highlight ô (${rowIndex}, ${cellInfo.col}) với giá trị: ${cellInfo.value}`);
    });
    
    // Không gọi row.commit()
  } catch (error) {
    console.error(`Lỗi khi highlight hàng ${rowIndex}:`, error);
  }
};