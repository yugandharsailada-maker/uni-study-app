# Mobile Testing Guide

## 🚀 Quick Start

### Method 1: Browser DevTools (Easiest - Recommended for Development)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open Chrome/Edge DevTools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Click the device toggle icon (📱) or press `Ctrl+Shift+M` (Windows) / `Cmd+Shift+M` (Mac)

3. **Test different devices:**
   - Select from preset devices (iPhone, iPad, Galaxy, etc.)
   - Or set custom dimensions
   - Test common breakpoints:
     - Mobile: 375px × 667px (iPhone SE)
     - Mobile: 390px × 844px (iPhone 12/13)
     - Tablet: 768px × 1024px (iPad)
     - Desktop: 1920px × 1080px

4. **Test touch interactions:**
   - Enable "Touch" mode in DevTools
   - Test button taps, scrolling, and gestures

### Method 2: Test on Real Mobile Device (Most Accurate)

1. **Find your computer's IP address:**
   - Windows: Open PowerShell and run `ipconfig` (look for IPv4 Address)
   - Mac/Linux: Run `ifconfig` or `ip addr` (look for inet address)
   - Example: `192.168.1.100`

2. **Start dev server:**
   ```bash
   npm run dev
   ```
   The server should be accessible on `http://[YOUR_IP]:8080`

3. **On your mobile device:**
   - Connect to the same Wi-Fi network
   - Open browser and go to: `http://[YOUR_IP]:8080`
   - Example: `http://192.168.1.100:8080`

4. **If connection fails:**
   - Check Windows Firewall (allow port 8080)
   - Ensure both devices are on the same network
   - Try using `localhost` if testing on the same device

### Method 3: Test Production Build

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   ```

3. **Test using Method 1 or 2 above**

### Method 4: Online Testing Tools

- **BrowserStack**: https://www.browserstack.com (free trial)
- **Responsive Design Checker**: https://responsivedesignchecker.com
- **Am I Responsive**: https://ui.dev/amiresponsive

## 📱 What to Test

### ✅ Layout & Responsiveness
- [ ] Header displays correctly on mobile
- [ ] Navigation is accessible
- [ ] Cards/grids stack properly on small screens
- [ ] Text is readable (not too small)
- [ ] No horizontal scrolling (unless intentional)
- [ ] Modals/sheets open full-width on mobile

### ✅ Touch Interactions
- [ ] Buttons are easy to tap (min 44px × 44px)
- [ ] Links are tappable
- [ ] Forms are easy to fill
- [ ] No accidental zoom on input focus (iOS)
- [ ] Scrolling is smooth

### ✅ Functionality
- [ ] All features work on mobile
- [ ] Forms submit correctly
- [ ] Modals open/close properly
- [ ] Tables scroll horizontally if needed
- [ ] Images load and display correctly

### ✅ Performance
- [ ] Page loads quickly
- [ ] Animations are smooth
- [ ] No lag when scrolling
- [ ] Touch responses are immediate

## 🔧 Troubleshooting

### Can't access from mobile device?
1. Check firewall settings (allow port 8080)
2. Verify both devices are on same network
3. Try disabling VPN if active
4. Check if antivirus is blocking connections

### DevTools not showing mobile view?
- Clear browser cache
- Try different browser (Chrome, Edge, Firefox)
- Ensure DevTools is in responsive mode

### Build issues?
- Run `npm run build` and check for errors
- Clear `dist` folder and rebuild
- Check console for errors

## 📊 Tested Devices

Keep track of devices you've tested:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Other: _______________



