// Test script để debug vấn đề netPriceCol
console.log('=== DEBUGGING NETPRICECOL ISSUE ===');

// Giả lập các giá trị settings như trong App.tsx
const file1Settings = {
  invoiceCol: 1,    // User input
  sellerCol: 2,     // User input  
  taxCodeCol: 3,    // User input
  netPriceCol: 4,   // User input
  startRow: 1       // User input
};

const file2Settings = {
  invoiceCol: 1,
  sellerCol: 2,
  taxCodeCol: 3,
  netPriceCol: 4,
  startRow: 1
};

// Trong App.tsx, các giá trị này được convert thành:
const file1InvoiceCol = file1Settings.invoiceCol - 1;  // 0
const file1StartRow = file1Settings.startRow - 1;      // 0
const file1SellerCol = file1Settings.sellerCol - 1;    // 1
const file1TaxCodeCol = file1Settings.taxCodeCol - 1;  // 2
const file1NetPriceCol = file1Settings.netPriceCol - 1; // 3

const file2InvoiceCol = file2Settings.invoiceCol - 1;  // 0
const file2StartRow = file2Settings.startRow - 1;      // 0
const file2SellerCol = file2Settings.sellerCol - 1;    // 1
const file2TaxCodeCol = file2Settings.taxCodeCol - 1;  // 2
const file2NetPriceCol = file2Settings.netPriceCol - 1; // 3

console.log('File 1 processed values:');
console.log({
  file1InvoiceCol,
  file1StartRow,
  file1SellerCol,
  file1TaxCodeCol,
  file1NetPriceCol
});

console.log('File 2 processed values:');
console.log({
  file2InvoiceCol,
  file2StartRow,
  file2SellerCol,
  file2TaxCodeCol,
  file2NetPriceCol
});

// Giả lập dữ liệu Excel (0-based indexing)
const file1Data = [
  ['Invoice', 'Seller', 'TaxCode', 'NetPrice', 'Other'],  // Row 0 (header)
  ['17784', 'Company A', '123456789', '1000000', 'Extra1'], // Row 1
  ['17785', 'Company B', '987654321', '2000000', 'Extra2']  // Row 2
];

const file2Data = [
  ['Invoice', 'Seller', 'TaxCode', 'NetPrice', 'Other'],  // Row 0 (header)
  ['17784', 'Company A', '123456789', '1000000', 'Extra1'], // Row 1
  ['17786', 'Company C', '111111111', '3000000', 'Extra3']  // Row 2
];

console.log('\n=== TESTING DATA ACCESS ===');
console.log('File1 Data:');
for (let i = 0; i < file1Data.length; i++) {
  const row = file1Data[i];
  console.log(`Row ${i}:`, row);
  
  if (i >= file1StartRow) {
    console.log(`  Invoice (col ${file1InvoiceCol}):`, row[file1InvoiceCol]);
    console.log(`  Seller (col ${file1SellerCol}):`, row[file1SellerCol]);
    console.log(`  TaxCode (col ${file1TaxCodeCol}):`, row[file1TaxCodeCol]);
    console.log(`  NetPrice (col ${file1NetPriceCol}):`, row[file1NetPriceCol]);
  }
}

console.log('\nFile2 Data:');
for (let i = 0; i < file2Data.length; i++) {
  const row = file2Data[i];
  console.log(`Row ${i}:`, row);
  
  if (i >= file2StartRow) {
    console.log(`  Invoice (col ${file2InvoiceCol}):`, row[file2InvoiceCol]);
    console.log(`  Seller (col ${file2SellerCol}):`, row[file2SellerCol]);
    console.log(`  TaxCode (col ${file2TaxCodeCol}):`, row[file2TaxCodeCol]);
    console.log(`  NetPrice (col ${file2NetPriceCol}):`, row[file2NetPriceCol]);
  }
}

// Test trường hợp netPriceCol trỏ sai
console.log('\n=== TESTING WRONG COLUMN SCENARIOS ===');

// Trường hợp 1: netPriceCol bị trỏ vào cột rỗng
const wrongFile1Data = [
  ['Invoice', 'Seller', 'TaxCode', '', 'NetPrice'],  // NetPrice ở cột 4 thay vì cột 3
  ['17784', 'Company A', '123456789', '', '1000000'],
  ['17785', 'Company B', '987654321', '', '2000000']
];

console.log('Wrong File1 Data (NetPrice at wrong column):');
for (let i = file1StartRow; i < wrongFile1Data.length; i++) {
  const row = wrongFile1Data[i];
  console.log(`Row ${i}: NetPrice (col ${file1NetPriceCol}):`, row[file1NetPriceCol]); // Sẽ là ''
  console.log(`Row ${i}: Actual NetPrice (col 4):`, row[4]); // Sẽ là '1000000'
}

console.log('\n=== ANALYSIS ===');
console.log('Nếu user cấu hình sai cột NetPrice, hoặc file Excel có cấu trúc khác với cấu hình,');
console.log('thì netPriceCol sẽ trỏ vào cột rỗng hoặc cột khác, dẫn đến netPrice bị rỗng.');
