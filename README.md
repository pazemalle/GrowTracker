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
- **� Grow Profiles**: Create reusable grow templates with predefined phases, environmental targets (VPD, DLI, PPFD), and nutrient schedules.
- **✨ Smart New Grow Wizard**: Step-by-step wizard to start a new grow, selecting strains, setups, and applying a profile for automated tracking.
- **�🎪 Setup Manager**: manage multiple grow tents and environments. Track lights, exhaust, filters, and circulation fans for each setup.
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
- **Testing**: Vitest (Unit), Playwright (E2E)

## 🧪 Testing

This project uses a comprehensive testing strategy ensuring stability and reliability.

### Unit & Integration Tests (Vitest)

Run unit tests for components and utilities:

```bash
npm run test
```

### End-to-End Tests (Playwright)

Run E2E tests to verify core user flows (Dashboard, Profiles, Setups, etc.):

```bash
npm run test:e2e
```

To view the UI report:

```bash
npx playwright show-report
```

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

### 💻 Local Development (Development Mode)

The easiest way to start the application locally for development is using the "full" development mode, which starts both the Backend API and the Frontend concurrently.

1. **Start Development Server**:

    ```bash
    npm run dev:full
    ```

2. **Open Browser**:
    - The application will be available at: `http://localhost:5173`
    - The API server runs on: `http://localhost:3001` (Note: Updated port)

### 🆕 First Run & Database

**Note:** The application automatically creates the database file (`server/growtracker.db`) if it doesn't exist.

- **Admin Account**: The **first user** you register will automatically be assigned the **Admin** role.
- **Data**: The database starts empty. You will need to create your first Grow config and Profiles.

### Alternate Manual Startup (Development)

If you prefer to run them separately:

**Backend:**

```bash
node server/index.js
```

**Frontend:**

```bash
npm run dev
```

### ☁️ Server Deployment (Production)

To deploy the application securely on a server (e.g., VPS, Docker):

1. **Build the Frontend**:

   ```bash
   npm run build
   ```

2. **Set Environment Variables**:
   - `JWT_SECRET`: A strong secret key for authentication.
   - `DB_PATH`: The absolute path where the database should be stored (essential for data persistence across updates or Docker volumes).
   - `PORT`: (Optional) Port to run on (default 3001).
   - `CORS_ORIGIN`: (Optional) Restrict API access to a specific origin.

3. **Start the Production Server**:

   ```bash
   NODE_ENV=production PORT=8080 DB_PATH=/app/data/growtracker.db JWT_SECRET=my_secure_secret npm start
   ```

   *Note: In production mode, the backend automatically serves the built frontend, so you only need to run this single command.*

### 🐳 Docker & Synology NAS Deployment

This application is fully Docker-ready, making it perfect for 24/7 deployment on a **Synology NAS** (via Container Manager) or any server running Docker. Thanks to the configured bind mounts, your SQLite database (`growtracker.db`) will be safely stored on your host and never lost during updates.

1. **Clone/Copy the project** to your NAS or Server.
2. Ensure you have Docker & Docker Compose installed (or "Container Manager" on Synology).
3. Open `docker-compose.yml` and **change the `JWT_SECRET`** to a secure random string.
4. Run the container:

   ```bash
   docker-compose up -d --build
   ```

5. The app will be available at: `http://<YOUR-NAS-IP>:3001`
6. **Data Persistence**: A new `data/` folder will be created next to your `docker-compose.yml`. This folder contains your `growtracker.db` and persists automatically!


## 📂 Project Structure

- `/src` - React Frontend application
- `/server` - Express Backend & SQLite Database (`growtracker.db`)
- `/src/i18n` - Translations (EN/DE)
- `/src/components` - React Components (Dashboard, GrowDetail, SetupManager, SeedBank, etc.)
- `/src/context` - State Management (Store, Auth, Language)

## 🤝 Contributing

Feel free to open issues or submit pull requests if you have ideas for improvements!

## 📄 License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details.

## 🤖 Built With

This project was created with the assistance of **Agentic AI**.
