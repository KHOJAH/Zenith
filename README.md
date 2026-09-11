# Zenith — The Ultimate Minimalist Expense Tracker

Zenith is an intelligent personal expense management and cash velocity application built for Android using **Expo SDK 57**, **Expo Router**, and **Local SQLite (`expo-sqlite`)**, fully compatible with **Expo Go**.

---

## Key Features

- **100% Offline-First Local Storage**: All transactions, category budgets, and velocity calculations run directly on your device via `expo-sqlite`. Zero backend required, zero latency, maximum privacy.
- **Tactile Quick Add (< 4s to log)**: Dedicated ergonomic 3x4 in-app numeric keypad with haptic feedback, real-time typing display, category grid, merchant suggestions, and split bill toggles.
- **Dual First-Class Themes**:
  - **Zenith Finance (Light Mode)**: Crisp white surfaces, soft ice-blue accents, and emerald cashflow highlights.
  - **Zenith Obsidian (Dark Mode)**: Midnight OLED canvas (`#0A0E17`), elevated charcoal cards, and mint emerald indicators.
  - Quick toggle directly from any screen header.
- **Algorithmic Analytics & Cash Velocity**:
  - Daily spend velocity badge (`$117.27/day`).
  - Proportional SVG Donut Chart mapping category distribution against monthly ceiling.
  - Vertical weekly run rate comparison bar chart (W1, W2, W3 active, W4 est).
  - Category budget health meters with warning coral flags.
- **Blank Slate & Demo Mode**: Starts clean with zero transactions, complete with polished empty states and a 1-tap "Load Demo Data" button to explore the October 2024 ledger.

---

## Running with Expo Go on Android

1. Ensure your phone and development machine are connected to the same Wi-Fi network.
2. Open terminal in the project directory:
   ```bash
   npx expo start
   ```
3. Open the **Expo Go** app on your Android device and scan the QR code displayed in your terminal.

---

## Project Structure

```
Zenith/
├── src/
│   ├── app/                      # Expo Router file-based screens
│   │   ├── _layout.tsx           # Providers (Theme, SQLite, SafeArea)
│   │   ├── index.tsx             # Root redirect to (tabs)
│   │   └── (tabs)/
│   │       ├── _layout.tsx       # Bottom tabs navigation wrapper
│   │       ├── index.tsx         # Module 1: Dashboard & Net Worth
│   │       ├── transactions.tsx  # Module 2: Transactions Ledger
│   │       ├── quick-add.tsx     # Module 4: Tactile Numeric Keypad
│   │       └── analytics.tsx     # Module 3: Budget Health & Donut Chart
│   ├── components/               # Reusable UI primitives (ThemedText, Card, Button, etc.)
│   ├── context/                  # ThemeContext & TransactionContext
│   ├── db/                       # SQLite schema, async CRUD, and seed data
│   ├── theme/                    # Design tokens (colors, spacing, typography, radius)
│   └── utils/                    # Financial math, cash velocity, formatters
├── package.json
└── app.json
```
