# KavitaReader - Asset Export & Implementation Guide

## 📦 What You Have

### Icons (512x512)
1. **Homestead Theme** - For wife's Kindle & Play Store
2. **Pipboy Green Theme** - For your Nova Launcher setup

### Feature Graphics (1024x500)
1. **Homestead Theme** - For Play Store listing
2. **Pipboy Green Theme** - Alternative/future use

---

## 🎨 How to Export SVGs as PNG

### Option 1: Online Converter (Easiest)
1. Go to https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set dimensions:
   - **Icons**: 512x512 pixels
   - **Feature Graphics**: 1024x500 pixels
4. Download PNG files

### Option 2: Using Inkscape (Free Desktop App)
```bash
# Install Inkscape
# Windows/Mac: Download from https://inkscape.org/

# Export via CLI
inkscape icon.svg --export-type=png --export-width=512 --export-height=512 -o icon.png
inkscape feature.svg --export-type=png --export-width=1024 --export-height=500 -o feature.png
```

### Option 3: Using ImageMagick
```bash
# Install ImageMagick
# Then convert:
convert -background none -size 512x512 icon.svg icon.png
convert -background none -size 1024x500 feature.svg feature.png
```

---

## 📱 Implementation Steps

### 1. Replace App Icons

#### For Expo Project:
```bash
# 1. Save your icon PNGs as:
assets/icon.png              # 1024x1024 (Expo will resize)
assets/adaptive-icon.png     # 1024x1024 (Foreground for Android)
assets/splash-icon.png       # Current splash icon
```

#### Update app.json:
```json
{
  "expo": {
    "icon": "./assets/icon-homestead.png",  // Use Homestead for store
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-homestead.png",
        "backgroundColor": "#3D4A2C"  // Homestead green
      }
    }
  }
}
```

### 2. For Nova Launcher (Your Phone)

#### Create Icon Pack:
1. Save Pipboy icon as `kavita-pipboy.png`
2. In Nova Launcher:
   - Long press app icon
   - Tap "Edit"
   - Tap icon
   - Select "Photos"
   - Choose `kavita-pipboy.png`

#### Or Use Icon Pack Apps:
- **Adapticons** - Create custom icon pack
- **Icon Pack Studio** - Professional icon pack creator
- **QuickPic** - Simple icon replacement

### 3. Play Store Assets Checklist

#### Required Images:
```
✅ App Icon (512x512)
   └─ icon-homestead.png

✅ Feature Graphic (1024x500)
   └─ feature-homestead.png

✅ Screenshots (2-8 required)
   Phone screenshots: 1080x1920 or similar
   - Home screen
   - Library view
   - Series detail
   - Reading view (EPUB)
   - Reading view (Comic)
   - Dark mode example
```

---

## 📸 Taking Good Screenshots

### Best Practices:
1. **Use clean test data** - No personal content
2. **Show key features**:
   - Server connection screen
   - Library browsing
   - Book/comic reading
   - Dark mode
   - File type support (EPUB, PDF, CBZ badges)
3. **Remove status bar** or use clean status bar
4. **Landscape + Portrait** if possible

### Using ADB for Screenshots:
```bash
# Connect device
adb devices

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Using Android Studio:
1. Run app in emulator
2. Click camera icon in toolbar
3. Screenshots automatically sized correctly

---

## 🎨 Color Reference

### Homestead Theme
```
Primary:       #3D4A2C (Dark Green)
Primary Light: #5A6B47
Accent:        #C86438 (Rust Orange)
Accent Light:  #D4734A
Background:    #FAFAFA (Light) / #121212 (Dark)
Text:          #1A1A1A (Light) / #FFFFFF (Dark)
```

### Pipboy Theme
```
Primary:       #00FF41 (Pipboy Green)
Secondary:     #00CC33
Tertiary:      #00AA2A
Accent:        #88FFB0 (Light green)
Background:    #0A0A0A / Transparent
Effects:       Glow, scanlines, terminal font
```

---

## 🚀 Build Commands

### Build for Testing (APK):
```bash
eas build --platform android --profile preview
```

### Build for Play Store (AAB):
```bash
eas build --platform android --profile production
```

### Build Profiles (eas.json):
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 📋 Pre-Launch Checklist

### Code:
- [ ] Set `DEBUG_ENABLED = false` in debugLogger.ts
- [ ] Update version in app.json (1.0.0)
- [ ] Test on physical devices (both themes)
- [ ] Test all file formats (EPUB, PDF, CBZ, CBR)
- [ ] Test server connection errors
- [ ] Test dark mode
- [ ] Test progress syncing

### Assets:
- [ ] Export Homestead icon (512x512)
- [ ] Export Pipboy icon (512x512) - for personal use
- [ ] Export Homestead feature graphic (1024x500)
- [ ] Take 4-8 screenshots
- [ ] Host privacy policy online
- [ ] Update email in privacy policy

### Play Store:
- [ ] App description written
- [ ] Short description (80 chars)
- [ ] Content rating questionnaire completed
- [ ] Target audience declared
- [ ] Category: Books & Reference

---

## 🎯 Quick Start

### Fastest Path to Publish:
```bash
# 1. Disable debug logs
# Edit: src/utils/debugLogger.ts
export const DEBUG_ENABLED = false;

# 2. Replace icons
cp icon-homestead.png assets/icon.png

# 3. Build
eas build --platform android --profile production

# 4. While building, prepare Play Store:
# - Upload feature graphic
# - Write descriptions
# - Take screenshots
# - Upload privacy policy

# 5. Upload AAB to Play Console when ready
```

---

## 💡 Tips

### Icon Design:
- Homestead theme is more professional for store
- Pipboy theme is fun for personal use
- Consider making Pipboy available as "alternate icon" in settings later

### Screenshots:
- Show the app in action, not empty screens
- Highlight unique features (file type badges, dark mode)
- Use the Homestead theme for consistency

### Store Listing:
- Emphasize privacy (no data collection)
- Mention self-hosted requirement
- List supported formats prominently
- Show beautiful screenshots

---

## 🔄 After Launch

### For Wife's Kindle:
- Install from Play Store
- Icons will use Homestead theme
- Clean, professional look

### For Your Phone:
- Install from Play Store
- Replace icon manually with Pipboy version
- Customize with Nova Launcher
- Enjoy the terminal aesthetic!

---

## 📞 Next Steps

1. Export icons as PNG
2. Take screenshots
3. Build with EAS
4. Upload to Play Console
5. Celebrate! 🎉