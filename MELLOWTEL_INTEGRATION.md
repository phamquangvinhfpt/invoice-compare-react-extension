# Mellowtel Integration Guide

This guide explains how to complete the Mellowtel integration in your Invoice Compare React Extension.

## What is Mellowtel?

Mellowtel is a service that allows your Chrome extension users to earn passive income by sharing their unused bandwidth. It's privacy-focused and only routes anonymous traffic through users' connections.

## Integration Status

✅ **Completed:**
- Mellowtel package installed (`mellowtel: ^1.6.2`)
- Background script integration added
- Manifest permissions updated
- MellowtelSettings component created
- UI integration in main app
- Service layer created for communication
- Build compiles successfully

⚠️  **Requires Action:**

1. **Get Configuration Key:**
   - Visit [https://mellowtel.it](https://mellowtel.it)
   - Create an account and register your extension
   - Get your configuration key
   - Replace `YOUR_CONFIGURATION_KEY_HERE` in `/src/background/index.ts` (line 7)

2. **Update Mellowtel API Calls:**
   - The current integration uses placeholder/mock methods
   - Once you have the configuration key, uncomment and update the actual API calls
   - Check Mellowtel documentation for correct method names

3. **Test the Integration:**
   - Build and test the extension
   - Verify settings modal opens correctly
   - Test enabling/disabling Mellowtel

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