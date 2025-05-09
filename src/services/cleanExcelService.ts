import { Workbook, Worksheet, Cell } from 'exceljs';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Các màu highlight
export const MISSING_INVOICE_COLOR = 'FFFF9999'; // Màu đỏ nhạt
export const MISMATCHED_SELLER_COLOR = 'FFe9c46a'; // Màu vàng nhạt (thêm FF phía trước)
export const DUPLICATED_INVOICE_COLOR = 'FFA8D1FF'; // Màu tím nhạt (thêm FF phía trước)

/**
 * Tạo một workbook mới hoàn toàn từ dữ liệu của workbook cũ
 * @param sourceWorkbook - Workbook gốc
 * @returns Workbook mới
 */
export const createCleanWorkbook = async (sourceWorkbook: Workbook): Promise<Workbook> => {
  // Tạo workbook mới
  const newWorkbook = new Workbook();
  
  // Lặp qua từng worksheet trong workbook gốc
  for (const sourceSheet of sourceWorkbook.worksheets) {
    // Tạo worksheet mới với cùng tên
    const newSheet = newWorkbook.addWorksheet(sourceSheet.name, {
      properties: { ...sourceSheet.properties }, // Sao chép các thuộc tính
      pageSetup: { ...sourceSheet.pageSetup },   // Sao chép cài đặt trang
      headerFooter: { ...sourceSheet.headerFooter } // Sao chép header và footer
    });
    
    // Sao chép merges (các ô được gộp) - QUAN TRỌNG cho các tiêu đề gộp ô
    const hasMergeCells = sourceSheet && typeof sourceSheet.mergeCells !== 'undefined';
    
    if (hasMergeCells) {
      try {
        // TypeScript không nhận ra mergeCells có thể là một mảng, nên chúng ta cần kiểm tra thủ công
        const mergeCellsArray = typeof sourceSheet.mergeCells === 'function' 
          ? [] 
          : (sourceSheet.mergeCells as unknown as string[]);
          
        if (Array.isArray(mergeCellsArray) && mergeCellsArray.length > 0) {
          mergeCellsArray.forEach(mergeCell => {
            try {
              newSheet.mergeCells(mergeCell);
            } catch (error) {
              console.warn(`Không thể gộp ô ${mergeCell}: ${error}`);
            }
          });
        }
      } catch (error) {
        console.warn('Không thể sao chép merged cells:', error);
      }
    }
    
    // Sao chép kích thước cột
    sourceSheet.columns.forEach((col, index) => {
      if (col.width) {
        newSheet.getColumn(index + 1).width = col.width;
      }
      
      // Sao chép style của cột (ẩn/hiện, định dạng số, v.v.)
      if (col.hidden) newSheet.getColumn(index + 1).hidden = col.hidden;
      if (col.outlineLevel) newSheet.getColumn(index + 1).outlineLevel = col.outlineLevel;
    });
    
    // Sao chép kích thước hàng
    sourceSheet.eachRow((row, rowIndex) => {
      const newRow = newSheet.getRow(rowIndex);
      
      // Sao chép chiều cao hàng
      if (row.height) newRow.height = row.height;
      
      // Sao chép thuộc tính ẩn/hiện và outline
      if (row.hidden) newRow.hidden = row.hidden;
      if (row.outlineLevel) newRow.outlineLevel = row.outlineLevel;
    });
    
    // Sao chép dữ liệu và style từng ô
    sourceSheet.eachRow((row, rowNumber) => {
      const newRow = newSheet.getRow(rowNumber);
      
      row.eachCell((cell, colNumber) => {
        const newCell = newRow.getCell(colNumber);
        
        // Sao chép giá trị
        newCell.value = cell.value;
        
        // Sao chép toàn bộ style (font, alignment, border, format, v.v.)
        if (cell.style) {
          // Font
          if (cell.style.font) {
            newCell.font = { ...cell.style.font };
          }
          
          // Alignment
          if (cell.style.alignment) {
            newCell.alignment = { ...cell.style.alignment };
          }
          
          // Border
          if (cell.style.border) {
            newCell.border = { ...cell.style.border };
          }
          
          // Number format
          if (cell.style.numFmt) {
            newCell.numFmt = cell.style.numFmt;
          }
          
          // Protection
          if (cell.style.protection) {
            newCell.protection = { ...cell.style.protection };
          }
        }
        
        // Thêm định dạng cho các ô NGOẠI TRỪ fill
        // Fill sẽ được thêm sau theo logic highlight
      });
      
      // Commit hàng
      newRow.commit();
    });
    
    // Sao chép cài đặt filters nếu có
    if (sourceSheet.autoFilter) {
      try {
        newSheet.autoFilter = sourceSheet.autoFilter;
      } catch (error) {
        console.warn(`Không thể sao chép autoFilter: ${error}`);
      }
    }
    
    // Sao chép views nếu có
    if (sourceSheet.views && sourceSheet.views.length > 0) {
      newSheet.views = [...sourceSheet.views];
    }
  }
  
  // Sao chép các properties toàn cục của workbook
  if (sourceWorkbook.properties) {
    newWorkbook.properties = { ...sourceWorkbook.properties };
  }
  
  console.log('Đã tạo workbook mới với đầy đủ định dạng');
  return newWorkbook;
};

/**
 * Highlight các ô cụ thể trong worksheet
 * @param worksheet - Worksheet cần highlight
 * @param rowIndex - Chỉ số hàng (1-based trong exceljs)
 * @param colorHex - Mã màu hex (phải bao gồm FF ở đầu) ví dụ: 'FFFF9999'
 */
export const highlightSpecificCells = (worksheet: Worksheet, rowIndex: number, colorHex: string): void => {
  try {
    console.log(`Highlight ô trong hàng ${rowIndex} với màu ${colorHex}`);
    
    // Kiểm tra hàng tồn tại
    if (rowIndex < 1 || rowIndex > worksheet.rowCount) {
      console.warn(`Hàng ${rowIndex} nằm ngoài phạm vi worksheet (1-${worksheet.rowCount})`);
      return;
    }
    
    // Lấy row
    const row = worksheet.getRow(rowIndex);
    
    // Danh sách ô có dữ liệu
    const cellsWithValue: number[] = [];
    
    // Xác định các ô có dữ liệu
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // Thêm vào danh sách
      cellsWithValue.push(colNumber);
    });
    
    console.log(`Hàng ${rowIndex} có ${cellsWithValue.length} ô có dữ liệu`);
    
    // Highlight từng ô cụ thể
    cellsWithValue.forEach(colNumber => {
      const cell = worksheet.getCell(rowIndex, colNumber);
      
      // Áp dụng fill
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorHex }
      };
      
      console.log(`  Đã highlight ô (${rowIndex},${colNumber})`);
    });
    
    // KHÔNG gọi row.commit()
  } catch (error) {
    console.error(`Lỗi khi highlight hàng ${rowIndex}:`, error);
  }
};

/**
 * Highlight các hàng có vấn đề trong file Excel
 * @param workbook - Workbook cần highlight 
 * @param missingRows - Mảng các chỉ số hàng thiếu
 * @param mismatchRows - Mảng các chỉ số hàng không khớp người bán
 * @param duplicatedRows - Mảng các chỉ số hàng trùng lặp
 * @param worksheetIndex - Chỉ số của worksheet (0-based)
 */
export const highlightProblemRowsClean = (
  workbook: Workbook, 
  missingRows: number[], 
  mismatchRows: number[], 
  duplicatedRows: number[] = [],
  worksheetIndex: number = 0
): void => {
  const worksheet = workbook.worksheets[worksheetIndex];
  
  console.log('=== HIGHLIGHT CLEAN DEBUG INFO ===');
  console.log('Worksheet:', worksheet.name);
  console.log('Missing rows:', missingRows);
  console.log('Mismatch rows:', mismatchRows);
  console.log('Duplicated rows:', duplicatedRows);
  
  // Xử lý hàng thiếu
  if (missingRows && missingRows.length > 0) {
    console.log(`Highlight ${missingRows.length} hàng thiếu với màu đỏ`);
    
    // Lọc và chuyển đổi sang 1-based
    const validMissingRows = missingRows
      .filter(row => row !== null && row !== undefined)
      .map(row => row + 1);
    
    console.log('Các hàng thiếu (1-based):', validMissingRows);
    
    // Highlight từng hàng
    validMissingRows.forEach(rowIndex => {
      highlightSpecificCells(worksheet, rowIndex, MISSING_INVOICE_COLOR);
    });
  }
  
  // Xử lý hàng không khớp
  if (mismatchRows && mismatchRows.length > 0) {
    console.log(`Highlight ${mismatchRows.length} hàng không khớp với màu vàng`);
    
    // Lọc và chuyển đổi sang 1-based
    const validMismatchRows = mismatchRows
      .filter(row => row !== null && row !== undefined)
      .map(row => row + 1);
    
    console.log('Các hàng không khớp (1-based):', validMismatchRows);
    
    // Highlight từng hàng
    validMismatchRows.forEach(rowIndex => {
      highlightSpecificCells(worksheet, rowIndex, MISMATCHED_SELLER_COLOR);
    });
  }
  
  // Xử lý hàng trùng lặp
  if (duplicatedRows && duplicatedRows.length > 0) {
    console.log(`Highlight ${duplicatedRows.length} hàng trùng lặp với màu tím`);
    
    // Lọc và chuyển đổi sang 1-based
    const validDuplicatedRows = duplicatedRows
      .filter(row => row !== null && row !== undefined)
      .map(row => row + 1);
    
    console.log('Các hàng trùng lặp (1-based):', validDuplicatedRows);
    
    // Highlight từng hàng
    validDuplicatedRows.forEach(rowIndex => {
      highlightSpecificCells(worksheet, rowIndex, DUPLICATED_INVOICE_COLOR);
    });
  }
  
  // Đảm bảo các merged cells được giữ nguyên
  try {
    // Kiểm tra merged cells một cách an toàn với TypeScript
    const hasMergeCells = worksheet && typeof worksheet.mergeCells !== 'undefined';
    
    if (hasMergeCells) {
      const mergeCellsArray = typeof worksheet.mergeCells === 'function'
        ? [] 
        : (worksheet.mergeCells as unknown as string[]);
        
      if (Array.isArray(mergeCellsArray)) {
        console.log(`Worksheet có ${mergeCellsArray.length} merged cells`);
      } else {
        console.log('Worksheet có mergeCells nhưng không thể đọc được như một mảng');
      }
    } else {
      console.log('Worksheet không có thuộc tính mergeCells');
    }
  } catch (error) {
    console.warn('Không thể truy cập thông tin merged cells:', error);
  }
  
  // Thêm chú thích
  addLegendClean(worksheet);
  
  console.log('=== END HIGHLIGHT CLEAN DEBUG ===');
};

/**
 * Thêm chú thích màu highlight vào worksheet
 * @param worksheet - Worksheet cần thêm chú thích
 */
export const addLegendClean = (worksheet: Worksheet): void => {
  try {
    // Tìm dòng cuối có dữ liệu
    let lastRowNum = worksheet.lastRow ? worksheet.lastRow.number : 1;
    lastRowNum += 2; // Thêm 2 dòng trống

    // Thêm tiêu đề chú thích
    const titleCell = worksheet.getCell(lastRowNum, 1);
    titleCell.value = 'Chú thích:';
    titleCell.font = { bold: true };

    // Thêm chú thích màu đỏ
    const redCell = worksheet.getCell(lastRowNum + 1, 1);
    redCell.value = 'Màu đỏ: Hóa đơn thiếu';
    redCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: MISSING_INVOICE_COLOR }
    };

    // Thêm chú thích màu vàng
    const yellowCell = worksheet.getCell(lastRowNum + 2, 1);
    yellowCell.value = 'Màu vàng: Người bán không khớp';
    yellowCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: MISMATCHED_SELLER_COLOR }
    };
    
    // Thêm chú thích màu tím
    const purpleCell = worksheet.getCell(lastRowNum + 3, 1);
    purpleCell.value = 'Màu tím: Hóa đơn trùng lặp';
    purpleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: DUPLICATED_INVOICE_COLOR }
    };
    
    console.log(`Đã thêm chú thích tại dòng ${lastRowNum}`);
  } catch (error) {
    console.error("Lỗi khi thêm chú thích:", error);
  }
};

/**
 * Tạo và tải file zip chứa các file Excel đã highlight với phương pháp sạch
 */
export const createAndDownloadCleanZip = async (
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
  try {
    console.log('=== CLEAN EXPORT STARTING ===');
    console.log('Creating ZIP with clean highlight approach');
    
    // Check merged cells trong workbook gốc để debug
    let file1MergedCells: string[] = [];
    let file2MergedCells: string[] = [];
    
    try {
      // Xử lý đúng kiểu của mergeCells
      const worksheet1 = file1Workbook.worksheets[0];
      const worksheet2 = file2Workbook.worksheets[0];
      
      const file1HasMergeCells = worksheet1 && typeof worksheet1.mergeCells !== 'undefined';
      const file2HasMergeCells = worksheet2 && typeof worksheet2.mergeCells !== 'undefined';
      
      if (file1HasMergeCells) {
        file1MergedCells = typeof worksheet1.mergeCells === 'function'
          ? []
          : (worksheet1.mergeCells as unknown as string[]);
      }
      
      if (file2HasMergeCells) {
        file2MergedCells = typeof worksheet2.mergeCells === 'function'
          ? []
          : (worksheet2.mergeCells as unknown as string[]);
      }
      
      console.log(`File 1 có ${file1MergedCells.length} merged cells`);
      console.log(`File 2 có ${file2MergedCells.length} merged cells`);
      
      if (file1MergedCells.length > 0) {
        console.log('Ví dụ merged cells trong File 1:', file1MergedCells.slice(0, 5));
      }
    } catch (error) {
      console.warn('Lỗi khi kiểm tra merged cells:', error);
    }
    
    const zip = new JSZip();
    
    // Log debugging info
    console.log('File 1:', file1Name);
    console.log('File 2:', file2Name);
    console.log('Missing in File 1:', missingInFile1.length, 'rows');
    console.log('Missing in File 2:', missingInFile2.length, 'rows');
    console.log('Mismatched in File 1:', mismatchedRowsFile1.length, 'rows');
    console.log('Mismatched in File 2:', mismatchedRowsFile2.length, 'rows');
    console.log('Duplicated in File 1:', duplicatedRowsFile1.length, 'rows');
    console.log('Duplicated in File 2:', duplicatedRowsFile2.length, 'rows');
    
    // Tạo workbook mới từ đầu cho file 1
    console.log('Creating clean workbook for File 1...');
    const cleanWorkbook1 = await createCleanWorkbook(file1Workbook);
    
    // Check merged cells trong workbook mới để debug
    let cleanFile1MergedCells: string[] = [];
    
    try {
      const worksheet0 = cleanWorkbook1.worksheets[0];
      const hasWorksheetMergeCells = worksheet0 && typeof worksheet0.mergeCells !== 'undefined';
      
      if (hasWorksheetMergeCells) {
        cleanFile1MergedCells = typeof worksheet0.mergeCells === 'function'
          ? []
          : (worksheet0.mergeCells as unknown as string[]);
      }
      
      console.log(`Clean File 1 có ${cleanFile1MergedCells.length} merged cells`);
      if (cleanFile1MergedCells.length > 0) {
        console.log('Ví dụ merged cells trong Clean File 1:', cleanFile1MergedCells.slice(0, 5));
      }
    } catch (error) {
      console.warn('Lỗi khi kiểm tra merged cells trong Clean File 1:', error);
    }
    
    console.log('Highlighting File 1...');
    highlightProblemRowsClean(cleanWorkbook1, missingInFile2, mismatchedRowsFile1, duplicatedRowsFile1, 0);
    
    // Tạo workbook mới từ đầu cho file 2
    console.log('Creating clean workbook for File 2...');
    const cleanWorkbook2 = await createCleanWorkbook(file2Workbook);
    console.log('Highlighting File 2...');
    highlightProblemRowsClean(cleanWorkbook2, missingInFile1, mismatchedRowsFile2, duplicatedRowsFile2, 0);
    
    // Tạo tên file
    const file1Parts = file1Name.split('.');
    const file1Ext = file1Parts.pop() || 'xlsx';
    const file1NameHighlighted = `${file1Parts.join('.')}_clean.${file1Ext}`;
    
    const file2Parts = file2Name.split('.');
    const file2Ext = file2Parts.pop() || 'xlsx';
    const file2NameHighlighted = `${file2Parts.join('.')}_clean.${file2Ext}`;
    
    // Export và thêm vào ZIP
    console.log('Exporting workbooks to buffer...');
    const buffer1 = await cleanWorkbook1.xlsx.writeBuffer();
    const buffer2 = await cleanWorkbook2.xlsx.writeBuffer();
    
    zip.file(file1NameHighlighted, buffer1);
    zip.file(file2NameHighlighted, buffer2);
    
    // Thêm readme
    const readme = `THÔNG TIN CÁC FILE HIGHLIGHT (PHƯƠNG PHÁP TẠO MỚI)

1. File: ${file1NameHighlighted}
   - Màu đỏ: Hóa đơn có trong File 1 nhưng không có trong File 2 (${missingInFile2.length} hàng)
   - Màu vàng: Số hóa đơn khớp nhưng người bán không khớp (${mismatchedRowsFile1.length} hàng)
   - Màu tím: Hóa đơn trùng lặp trong File 1 (${duplicatedRowsFile1.length} hàng)

2. File: ${file2NameHighlighted}
   - Màu đỏ: Hóa đơn có trong File 2 nhưng không có trong File 1 (${missingInFile1.length} hàng)
   - Màu vàng: Số hóa đơn khớp nhưng người bán không khớp (${mismatchedRowsFile2.length} hàng)
   - Màu tím: Hóa đơn trùng lặp trong File 2 (${duplicatedRowsFile2.length} hàng)

Ghi chú: Các file được tạo với phương pháp mới, chỉ highlight chính xác các ô có dữ liệu trong các hàng cần thiết, 
đồng thời giữ nguyên định dạng gốc của file Excel.`;
    
    zip.file("readme.txt", readme);
    
    // Tạo ZIP và tải xuống
    const now = new Date();
    const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}`;
    const zipFileName = `ket_qua_clean_${dateStr}.zip`;
    
    console.log(`Creating ZIP file: ${zipFileName}`);
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, zipFileName);
    
    console.log('=== CLEAN EXPORT COMPLETE ===');
    return;
  } catch (error) {
    console.error('Error creating clean ZIP:', error);
    throw error;
  }
};
