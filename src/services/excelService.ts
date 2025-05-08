import { Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Các màu highlight
export const MISSING_INVOICE_COLOR = 'FFFF9999'; // Màu đỏ nhạt
export const MISMATCHED_SELLER_COLOR = 'FFFFFF99'; // Màu vàng nhạt

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
  // Đảm bảo rowIndex là 1-based (ExcelJS sử dụng 1-based indexing)
  const row = worksheet.getRow(rowIndex);
  
  // Lấy tất cả các ô trong hàng
  row.eachCell({ includeEmpty: true }, (cell) => {
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
    // Không sao chép lại fill vì chúng ta muốn ghi đè nó
  });

  // Lưu thay đổi
  row.commit();
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
  } catch (error) {
    console.error("Lỗi khi thêm chú thích:", error);
  }
};

/**
 * Highlight các dòng có vấn đề trong file Excel
 * @param workbook - Workbook cần highlight
 * @param missingRows - Mảng các chỉ số hàng thiếu
 * @param mismatchRows - Mảng các chỉ số hàng không khớp người bán
 * @param worksheetIndex - Chỉ số của worksheet (0-based)
 */
export const highlightProblemRows = (
  workbook: Workbook, 
  missingRows: number[], 
  mismatchRows: number[], 
  worksheetIndex: number = 0
): void => {
  const worksheet = workbook.worksheets[worksheetIndex];
  
  // Debug thông tin để đảm bảo đang highlight đúng dòng
  console.log("Highlight các dòng có vấn đề:", {
    missingRows: missingRows ? `${missingRows.length} dòng` : "không có",
    mismatchRows: mismatchRows ? `${mismatchRows.length} dòng` : "không có"
  });
  
  // Highlight các dòng thiếu
  if (missingRows && missingRows.length > 0) {
    console.log(`Highlight ${missingRows.length} dòng thiếu`);
    missingRows.forEach(rowIdx => {
      if (rowIdx !== undefined && rowIdx !== null) {
        // Convert from 0-based to 1-based indexing
        const excelRowIndex = rowIdx + 1;
        console.log(`Highlighting missing row at index: ${rowIdx} (Excel row: ${excelRowIndex})`);
        highlightRow(worksheet, excelRowIndex, MISSING_INVOICE_COLOR);
      } else {
        console.warn("Bỏ qua dòng không xác định:", rowIdx);
      }
    });
  }
  
  // Highlight các dòng không khớp người bán
  if (mismatchRows && mismatchRows.length > 0) {
    console.log(`Highlight ${mismatchRows.length} dòng không khớp người bán`);
    mismatchRows.forEach(rowIdx => {
      if (rowIdx !== undefined && rowIdx !== null) {
        // Convert from 0-based to 1-based indexing
        const excelRowIndex = rowIdx + 1;
        console.log(`Highlighting mismatched row at index: ${rowIdx} (Excel row: ${excelRowIndex})`);
        highlightRow(worksheet, excelRowIndex, MISMATCHED_SELLER_COLOR);
      } else {
        console.warn("Bỏ qua dòng không khớp không xác định:", rowIdx);
      }
    });
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
  mismatchedRowsFile2: number[]
): Promise<void> => {
  const zip = new JSZip();
  
  // Clone workbook 1 và highlight
  const file1Buffer = await file1Workbook.xlsx.writeBuffer();
  const clonedWorkbook1 = new Workbook();
  await clonedWorkbook1.xlsx.load(file1Buffer);
  highlightProblemRows(clonedWorkbook1, missingInFile2, mismatchedRowsFile1, 0);
  
  // Clone workbook 2 và highlight
  const file2Buffer = await file2Workbook.xlsx.writeBuffer();
  const clonedWorkbook2 = new Workbook();
  await clonedWorkbook2.xlsx.load(file2Buffer);
  highlightProblemRows(clonedWorkbook2, missingInFile1, mismatchedRowsFile2, 0);
  
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
  
  // Thêm readme
  const readme = `THÔNG TIN CÁC FILE HIGHLIGHT

1. File: ${file1NameHighlighted}
   - Màu đỏ: Hóa đơn có trong File 1 nhưng không có trong File 2
   - Màu vàng: Số hóa đơn khớp nhưng người bán không khớp

2. File: ${file2NameHighlighted}
   - Màu đỏ: Hóa đơn có trong File 2 nhưng không có trong File 1
   - Màu vàng: Số hóa đơn khớp nhưng người bán không khớp`;
  
  zip.file("readme.txt", readme);
  
  // Tạo và tải xuống zip
  const now = new Date();
  const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}`;
  const zipFileName = `ket_qua_so_sanh_${dateStr}.zip`;
  
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, zipFileName);
};
