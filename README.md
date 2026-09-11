# Zenith — Minimalist Expense & Cash Velocity Tracker

<p align="center">
  <img src="./assets/images/icon.png" width="128" height="128" alt="Zenith App Icon" style="border-radius: 28px;" />
</p>

<p align="center">
  <b>A private, high-performance financial ledger built with Expo SDK 57, React Native Reanimated, and local SQLite.</b>
</p>

---

## Highlights & Features

### 1. Pure Expense & Income Architecture
- **Streamlined Ledger**: Zero clutter — no redundant transfers, split bills, complex budget caps, or merchant fields. Just pure financial flow: what comes in and what goes out.
- **Red & Green Visual Hierarchy**: Expenses are rendered in high-contrast red (`#DC2626` light / `#EF4444` dark) and Income in vibrant emerald green (`#059669` light / `#10B981` dark) across every metric, transaction item, and input.
- **Contextual Payment Methods**: Payment methods (**Card** & **Cash**) are selectively assigned to expenses, and cleanly omitted for income entries.

### 2. Salary Day (Payday) Recurring Cycle Engine
- **Custom Payday Alignment**: Instead of rigid calendar months, track spending aligned with when you actually get paid (e.g., 27th to 26th).
- **Intelligent Period Calculation**: Automatically handles leap years, month length variations (28–31 days), and year transitions.
- **Days-Left Countdown**: Real-time indicator displaying how many days remain until your next payday.

### 3. Dynamic Multi-Currency Converter
- **Instant Recalculation**: Log expenses in any currency (USD, JOD, EUR, GBP, AED, SAR, and more) and switch the active currency at any time — historical records dynamically recalculate their converted values in real time.
- **Persistent Preferences**: Selected display currency and custom salary day are saved locally and persist across reloads.

### 4. Tactile & Ergonomic UX
- **Native Device Numpad**: Direct invocation of your device's native decimal keypad for familiar, rapid entry.
- **2-Column Category Grid**: Clean 2-column layout designed to fit category titles without awkward line breaks, featuring a built-in **+ Custom Category** modal with icon selection.
- **Spring Physics & Haptics**: Powered by **React Native Reanimated 4** and **Expo Haptics** for tactile press feedback (`scale: 0.95`).

### 5. Analytics & Financial Statements
- **Category Donut Distribution**: Proportional SVG breakdown of your primary outflow drivers.
- **Weekly Spending Velocity**: Outflow pace bar chart highlighting active week spending.
- **Savings Rate Banner**: Period savings percentage and net retained capital overview.
- **Statement Exporter**: RFC 4180-compliant CSV export with native iOS/Android system share sheet, web browser download, and clipboard summary copying.

### 6. 100% Private & Offline-First
- **Local SQLite Engine**: All data stays strictly on your device via `expo-sqlite`. Zero remote tracking, zero telemetry, and full offline functionality.
- **Destructive Action Confirmation**: Long-press or modal actions require confirmation to prevent accidental deletions, with a dedicated "Clear All" ledger wipe tool.

---

## Dual First-Class Themes

| Clean White (Default) | Obsidian OLED (Dark) |
| :--- | :--- |
| Pure `#FFFFFF` background, slate typography, ice-blue surface cards, and crisp contrast. | `#000000` true black OLED background, midnight elevated surfaces, and glowing accents. |

---

## Building an Android APK

Zenith comes pre-configured with `eas.json` for standalone Android APK generation:

### Option 1: EAS Cloud Build (Easiest — No local Android SDK needed)
```bash
# 1. Log in to your Expo account
npx eas-cli login

# 2. Link your project (one-time setup)
npx eas-cli init

# 3. Start the cloud APK build
npx eas-cli build -p android --profile preview
```
*When finished, EAS gives you a direct `.apk` download link and QR code to install on your phone.*

### Option 2: Local Build (Unlimited & runs on your PC)
*Requires Android Studio, Android SDK, and Java JDK 17+ configured.*
```bash
npx eas-cli build -p android --profile preview --local
```
*Or with native Gradle:*
```powershell
npx expo prebuild -p android
cd android
.\gradlew assembleRelease
```
*The APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.*

---

## Project Structure

```
Zenith/
├── assets/
│   └── images/                   # App icon, splash screen, and logos
├── src/
│   ├── app/                      # Expo Router file-based screens
│   │   ├── _layout.tsx           # Providers (Theme, SQLite, SafeArea)
│   │   ├── index.tsx             # Root redirect
│   │   └── (tabs)/
│   │       ├── _layout.tsx       # Bottom tabs navigation wrapper
│   │       ├── index.tsx         # Dashboard & Cash Flow Matrix
│   │       ├── transactions.tsx  # Transaction Ledger & Search
│   │       ├── quick-add.tsx     # Quick Add with Native Keypad
│   │       └── analytics.tsx     # Donut Chart & Outflow Velocity
│   ├── components/               # UI components (Header, CategoryGrid, Modals)
│   ├── context/                  # ThemeContext & TransactionContext
│   ├── db/                       # SQLite schema & database operations
│   ├── theme/                    # Semantic design tokens & palettes
│   └── utils/                    # Salary cycle engine, currency math, formatters
├── app.json                      # Expo app configuration & package identity
├── eas.json                      # EAS build profiles (APK preview & production)
└── package.json
```

---

## Running in Development

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```
- Press `a` for Android Emulator / connected device.
- Press `w` for Web preview.
- Scan the QR code with **Expo Go** on physical devices.
