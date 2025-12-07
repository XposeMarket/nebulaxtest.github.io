# Mobile Phantom Wallet UX - Implementation Guide

## Overview

This implementation adds a mobile-friendly wallet connection flow using the **"Open in Phantom" deep link approach**. When users access NebulaX on mobile without a Solana provider (i.e., outside Phantom's in-app browser), they see a banner directing them to open the page inside Phantom.

## How It Works

### 1. Environment Detection

Two helper functions detect the mobile/provider context:

```javascript
NX.Env.isMobileDevice()     // Returns true if on Android/iOS
NX.Env.hasSolanaProvider()  // Returns true if window.solana exists
```

These are attached to `window.NX.Env` in `assets/nx-wallet.js` and can be used by any page.

### 2. Banner Display Logic

The banner is shown **ONLY IF**:
- User is on a mobile device, AND
- `window.solana` is NOT present (i.e., not already in Phantom's in-app browser)

When these conditions are true:
1. A sticky banner appears at the top of the page
2. It displays: "To connect your wallet on mobile, open this page inside the Phantom app."
3. An "Open in Phantom" button provides a deep link
4. A close (✕) button dismisses the banner
5. Dismissed state is saved to `localStorage` (key: `nxHideMobilePhantomBanner`)

### 3. Deep Link Format

The banner constructs a Phantom universal link:

```
https://phantom.app/ul/browse/{encodeURIComponent(currentUrl)}
```

This opens the current page inside Phantom's in-app browser. Once inside, `window.solana` will be available and the existing wallet connection flow works normally.

### 4. Files Modified/Created

#### New Files:
- `assets/css/nx-mobile-banner.css` — Styling for the banner (sticky top, cyan accents, responsive)

#### Modified Files:
- `assets/nx-wallet.js` — Added environment helpers and banner initialization
- `NebulaX.html` — Added CSS link
- `Coinpage-Official.html` — Added CSS link
- `nebula_x_store_official.html` — Added CSS link
- `NEBX-Arcade.html` — Added CSS link

### 5. CSS Styling

The banner uses:
- Sticky positioning (top of viewport)
- Cyan border and button styling (matches NebulaX theme)
- Flexbox layout with responsive breakpoints
- Smooth transitions on hover/active states
- Respects `prefers-reduced-motion` setting

### 6. Usage

The banner initializes automatically on pages where the CSS is included. It runs on `DOMContentLoaded` if needed, or immediately if the DOM is already loaded.

**To manually trigger on a new page:**

```html
<!-- Include the CSS -->
<link rel="stylesheet" href="assets/css/nx-mobile-banner.css">

<!-- Include the wallet script (it auto-initializes) -->
<script src="assets/nx-wallet.js"></script>
```

No additional code needed—the banner will appear if conditions are met.

### 7. Desktop & In-App Browser Behavior

- **Desktop**: Banner does NOT appear (no mobile + has provider)
- **Mobile Safari/Chrome**: Banner appears (mobile + no provider)
- **Inside Phantom App**: Banner does NOT appear (provider is injected at `window.solana`)
- **After opening in Phantom**: Existing wallet flow works unchanged

### 8. Local Storage Flag

Users can dismiss the banner persistently by setting:

```javascript
localStorage.setItem("nxHideMobilePhantomBanner", "true");
```

Clear it to show the banner again:

```javascript
localStorage.removeItem("nxHideMobilePhantomBanner");
```

## Testing

### Desktop
- Banner should NOT appear
- Existing wallet connection flow unchanged

### Mobile (Safari/Chrome, Solana not installed)
- Banner should appear at top of page
- Button links to `https://phantom.app/ul/browse/{currentUrl}`
- Close button removes banner and saves flag

### Mobile (Inside Phantom App)
- Banner should NOT appear
- Existing wallet connection flow unchanged

## Future Enhancements

- Add app-scheme fallback (`phantom://...`) for advanced scenarios
- Parse callback hash (`#phantom-callback`) if using stateful auth
- Integrate full Solana Mobile Wallet Adapter when ready
- Add analytics to track banner impressions/clicks

## Notes

- This is a **MVP** implementation—no full WalletConnect or SMWA yet
- Desktop wallet detection & connection remains unchanged
- All changes are localized to banner UX + environment helpers
- No Tailwind build pipeline changes; uses CDN + inline CSS
