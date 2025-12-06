# 🌱 Cannabis Grow Tracker

A powerful, modern, and full-stack application designed to help you plan, track, and optimize your cannabis cultivation journey.

## ✨ Features

- **📊 Dashboard Overview**: Get a quick snapshot of all your active grows, current stages, and days since start.
- **📝 Detailed Logging**: Track every detail of your grow including:
  - **Environment**: Temperature, Humidity, VPD (Auto-calculated), DLI, PPFD.
  - **Nutrients**: Log nutrient feedings with support for custom nutrient profiles.
  - **Photos**: Attach images to your logs to visually track progress.
- **🧠 Smart Automation**:
  - **VPD Calculation**: Automatically calculates Vapor Pressure Deficit based on your inputs.
  - **Auto-Titles**: Log titles are automatically generated based on the day and week (e.g., "Tag 15 / Woche 3").
  - **Stage Sync**: Automatically detects and syncs the current growth stage from your latest logs.
- **🧬 Grow Profiles**: Create and save reusable templates (Veg/Flower duration, target values) to streamline new grows.
- **🔄 Hybrid Storage**:
  - **Guest Mode**: All data stored locally in your browser (IndexedDB).
  - **Server Mode**: Securely sync your data to the backend SQLite database.
- **🌍 Multi-Language**: Fully localized in **German (DE)** and **English (EN)**.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: SQLite (Simple file-based, no setup required)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1. **Clone the repository** (or download the source code):

    ```bash
    git clone https://github.com/pazemalle/GrowTracker.git
    cd GrowTracker
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

### ▶️ Running the App

The easiest way to start the application is using the "full" development mode, which starts both the Backend API and the Frontend at the same time.

1. **Start Development Server**:

    ```bash
    npm run dev:full
    ```

2. **Open Browser**:
    - The application will be available at: `http://localhost:5173`
    - The API server runs on: `http://localhost:3000`

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
- `/src/i18n` - Translations
- `/src/components` - React Components

## 🤝 Contributing

Feel free to open issues or submit pull requests if you have ideas for improvements!
