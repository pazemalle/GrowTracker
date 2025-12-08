# 🌱 Cannabis Grow Tracker

A powerful, modern, and full-stack application designed to help you plan, track, and optimize your cannabis cultivation journey. Now featuring cloud synchronization, multi-setup management, and a comprehensive seed bank.

## ✨ Features

- **📊 Dashboard Overview**: Get a quick snapshot of all your active grows, current stages, and days since start. Now displays assigned setups directly on the card.
- **📝 Detailed Logging**: Track every detail of your grow including:
  - **Environment**: Temperature, Humidity, VPD (Auto-calculated), DLI, PPFD.
  - **Nutrients**: Log nutrient feedings with support for custom nutrient profiles.
  - **Media**: Attach images to your logs to visually track progress.
- **🧠 Smart Automation**:
  - **VPD Calculation**: Automatically calculates Vapor Pressure Deficit based on your inputs.
  - **Auto-Titles**: Log titles are automatically generated based on the day and week (e.g., "Tag 15 / Woche 3").
  - **Stage Sync**: Automatically detects and syncs the current growth stage from your latest logs.
- **🎪 Setup Manager**: manage multiple grow tents and environments. Track lights, exhaust, filters, and circulation fans for each setup.
- **🧬 Seed Bank**: Organize your seed inventory. Track breeders, strains, phenotypes (Auto/Fem/Reg), flowering times, and stock levels.
- **👤 User Management**:
  - **Account System**: Register and login to sync your data across devices.
  - **Admin Panel**: Manage users, reset passwords, and toggle roles (Admin/User).
  - **Hybrid Storage**: Use locally (Guest Mode) or sync to the server (Authenticated).
- **🌍 Internationalization**: Fully translated into English and German.
- **🎨 Modern UI**: Sleek, dark-mode glassmorphism design with smooth fade-in animations.

## 🛠️ Tech Stack

- **Frontend**: React, TailwindCSS, Lucide Icons, Vite
- **Backend**: Node.js, Express
- **Database**: SQLite (Stored locally on server) + JSON fallback

## 🚀 Getting Started

### Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/pazemalle/GrowTracker.git
    cd GrowTracker
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

### ▶️ Running the App

The easiest way to start the application is using the "full" development mode, which starts both the Backend API and the Frontend concurrently.

1. **Start Development Server**:

    ```bash
    npm run dev:full
    ```

2. **Open Browser**:
    - The application will be available at: `http://localhost:5173`
    - The API server runs on: `http://localhost:3001` (Note: Updated port)

### Alternate Manual Startup

If you prefer to run them separately:

**Backend:**

```bash
node server/index.js
```

**Frontend:**

```bash
npm run dev
```

## 📂 Project Structure

- `/src` - React Frontend application
- `/server` - Express Backend & SQLite Database (`growtracker.db`)
- `/src/i18n` - Translations (EN/DE)
- `/src/components` - React Components (Dashboard, GrowDetail, SetupManager, SeedBank, etc.)
- `/src/context` - State Management (Store, Auth, Language)

## 🤝 Contributing

Feel free to open issues or submit pull requests if you have ideas for improvements!
