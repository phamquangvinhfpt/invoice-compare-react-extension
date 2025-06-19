// Script tự động tăng phiên bản trong package.json và manifest.json
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Kiểm tra xem commit hiện tại có phải là commit tăng phiên bản không
function isVersionBumpCommit() {
  try {
    // Lấy commit message gần nhất
    const lastCommitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    return lastCommitMessage.includes('Bump version to') && lastCommitMessage.includes('[skip ci]');
  } catch (error) {
    console.error('Không thể kiểm tra commit message:', error);
    return false;
  }
}

// Nếu đây là commit tăng phiên bản, không tăng nữa
if (isVersionBumpCommit()) {
  console.log('Đây là commit tăng phiên bản, không tăng phiên bản lần nữa.');
  
  // Đọc package.json để in phiên bản hiện tại
  const packagePath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('Giữ nguyên phiên bản:', packageJson.version);
  
  // In phiên bản cho GitHub Actions
  console.log(`::set-output name=version::${packageJson.version}`);
  
  process.exit(0);
}

// Đọc package.json
const packagePath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Đọc manifest.json
const manifestPath = path.resolve(__dirname, '../public/manifest.json');
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Lấy phiên bản hiện tại
const currentVersion = packageJson.version;
console.log('Phiên bản hiện tại:', currentVersion);

// Tách phiên bản thành các phần
const versionParts = currentVersion.split('.');

// Đảm bảo có đủ 3 phần trong phiên bản (major.minor.patch)
while (versionParts.length < 3) {
  versionParts.push('0');
}

// Chuyển đổi tất cả thành số
const numericParts = versionParts.map(Number);

// Tăng phiên bản patch (phần thứ 3)
numericParts[2] += 1;

// Nếu phiên bản patch vượt quá 9, tăng phiên bản minor và reset patch về 0
if (numericParts[2] > 9) {
  numericParts[1] += 1;
  numericParts[2] = 0;
  
  // Nếu phiên bản minor vượt quá 9, tăng phiên bản major và reset minor về 0
  if (numericParts[1] > 9) {
    numericParts[0] += 1;
    numericParts[1] = 0;
  }
}

// Ghép lại thành chuỗi phiên bản mới
const newVersion = numericParts.join('.');
console.log('Phiên bản mới:', newVersion);

// Cập nhật phiên bản trong package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
console.log('Đã cập nhật phiên bản trong package.json');

// Cập nhật phiên bản trong manifest.json
manifestJson.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2), 'utf8');
console.log('Đã cập nhật phiên bản trong manifest.json');

console.log('Quá trình cập nhật phiên bản hoàn tất!');

// Nhận thông tin ghi chú phiên bản từ tham số dòng lệnh hoặc sử dụng mặc định
const releaseNotes = process.argv[2] || 'Cập nhật tính năng và sửa lỗi.';

// Tạo ra thông tin phiên bản để sử dụng trong quá trình build
const versionInfo = {
  version: newVersion,
  buildDate: new Date().toISOString(),
  releaseNotes: releaseNotes
};

// Tạo thư mục src nếu chưa tồn tại
const srcDir = path.resolve(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Ghi thông tin phiên bản vào file
fs.writeFileSync(
  path.resolve(srcDir, 'version.json'),
  JSON.stringify(versionInfo, null, 2),
  'utf8'
);
console.log('Đã tạo file version.json với thông tin phiên bản');

// In phiên bản mới để GitHub Actions có thể sử dụng
console.log(`::set-output name=version::${newVersion}`);

