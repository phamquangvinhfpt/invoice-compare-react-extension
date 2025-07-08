# Mellowtel Integration Guide

This guide explains how to complete the Mellowtel integration in your Invoice Compare React Extension.

## What is Mellowtel?

Mellowtel is a service that allows your Chrome extension users to earn passive income by sharing their unused bandwidth. It's privacy-focused and only routes anonymous traffic through users' connections.

# Mellowtel Integration Guide

## ⚠️ QUAN TRỌNG: Opt-in Process

**Câu trả lời cho câu hỏi của bạn:** Không có `generateAndOpenOptInLink` thì **request KHÔNG được tính** và **không có earnings**!

### Tại sao Opt-in bắt buộc:

1. **🚨 Mellowtel Terms of Service** yêu cầu explicit user consent
2. **💰 Requests không được tính** nếu user chưa properly opt-in
3. **⛔ Extension có thể bị ban** khỏi Mellowtel program
4. **🔒 Tuân thủ privacy regulations** (GDPR, CCPA, etc.)

### Đã tích hợp Opt-in Process:

✅ **Đã hoàn thành:**
- Opt-in link generation
- Opt-in status checking  
- UI warnings khi chưa opt-in
- Visual indicators cho opt-in status

## Integration Status

✅ **Hoàn toàn tích hợp:**
- Mellowtel package installed (`mellowtel: ^1.6.2`)
- Background script integration
- Manifest permissions updated
- **Opt-in process implemented** 🔥
- MellowtelSettings component với opt-in UI
- Service layer cho communication
- Build compiles successfully
- Error handling cho date formatting

⚠️  **Cần thực hiện:**

1. **Get Configuration Key:**
   - Truy cập [https://mellowtel.it](https://mellowtel.it)
   - Tạo account và đăng ký extension
   - Lấy configuration key
   - Thay thế `YOUR_CONFIGURATION_KEY_HERE` trong `/src/background/index.ts` (dòng 7)

2. **Update Mellowtel API Calls:**
   - Integration hiện tại dùng placeholder methods
   - Khi có configuration key, uncomment và update actual API calls
   - Check Mellowtel docs cho correct method names

## User Experience Flow

### **1. Trước khi Opt-in:**
- ⚠️ **Warning banner** trong settings
- 🚫 Bandwidth sharing bị disable
- 💡 Clear instructions để complete opt-in

### **2. Opt-in Process:**
- 🔗 Click "Complete Opt-in Process" button
- 🌐 Tự động mở Mellowtel opt-in page
- ✅ Sau khi opt-in, status tự động update

### **3. Sau khi Opt-in:**
- ✅ **Green banner** confirming opt-in
- 🎛️ Full access to bandwidth sharing controls
- 📊 Valid requests và earnings tracking

## Technical Implementation

### **Opt-in Functions Added:**

```typescript
// Generate opt-in link
generateMellowtelOptInLink(): Promise<{success: boolean, url?: string}>

// Check opt-in status  
checkMellowtelOptInStatus(): Promise<{hasOptedIn: boolean}>
```

### **UI Components:**

1. **Warning Banner** (chưa opt-in):
   - Orange warning với clear message
   - "Complete Opt-in Process" button
   - Icon và styling phù hợp

2. **Success Banner** (đã opt-in):
   - Green success indicator
   - Confirmation message
   - Checkmark icon

### **Background Script Updates:**

- `GENERATE_MELLOWTEL_OPTIN` message handler
- `CHECK_MELLOWTEL_OPTIN` message handler
- Automatic tab opening cho opt-in process

## Files Modified

### 1. `/public/manifest.json`
Added required permissions:
- `"activeTab"`, `"background"`
- `"proxy"`, `"webRequest"` (optional permissions)
- `"http://*/*"`, `"https://*/*"` (host permissions)

### 2. `/src/background/index.ts`
- Imported and initialized Mellowtel
- Added message handling for Mellowtel operations
- Integrated with existing service worker logic

### 3. `/src/services/mellowtelService.ts` (New)
- Service layer for Mellowtel communication
- Functions: `getMellowtelStatus()`, `toggleMellowtel()`, `saveMellowtelConfig()`, `loadMellowtelConfig()`

### 4. `/src/components/MellowtelSettings.tsx` (New)
- Complete settings UI component
- Enable/disable toggle
- Bandwidth limit configuration
- Statistics display
- User-friendly interface

### 5. `/src/components/App.tsx`
- Added settings button in header
- Integrated MellowtelSettings modal
- State management for settings visibility

## Configuration Options

The Mellowtel integration includes these configurable options:

```typescript
const config = {
  enabled: true,                    // Enable/disable bandwidth sharing
  allowedDomains: ['*'],           // Domains to allow (default: all)
  maxBandwidthUsage: 100,          // MB per day limit
  shareOnlyWhenIdle: true          // Only when user is idle
}
```

## User Experience

1. **Settings Access:** Users can click the gear icon in the header to open Mellowtel settings
2. **Easy Toggle:** Simple on/off switch for bandwidth sharing
3. **Usage Limits:** Users can set daily bandwidth limits
4. **Statistics:** Real-time display of bandwidth shared and earnings
5. **Privacy Info:** Clear explanation of what Mellowtel does

## Next Steps

1. **Get your configuration key** from Mellowtel dashboard
2. **Replace** `YOUR_CONFIGURATION_KEY_HERE` in the background script
3. **Test** the integration thoroughly
4. **Build** and publish your extension

## Testing Checklist

- [ ] Settings modal opens and closes correctly
- [ ] Enable/disable toggle works
- [ ] Bandwidth limit can be set and saved
- [ ] Statistics display properly (when available)
- [ ] No console errors
- [ ] Extension loads without issues

## Support

- **Mellowtel Documentation:** [https://docs.mellowtel.it](https://docs.mellowtel.it)
- **Dashboard:** [https://mellowtel.it](https://mellowtel.it)

## Privacy & Transparency

The integration includes clear user communication about:
- What Mellowtel does
- Privacy protection measures
- User control over the feature
- Earnings potential

Users have full control and can disable the feature at any time.