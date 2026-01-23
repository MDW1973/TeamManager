# Project Structure

## Electron App Files (New)

### Core Application
- **main.js** - Electron main process
  - Creates the app window
  - Initializes SQLite database
  - Handles all IPC (Inter-Process Communication) requests
  - Manages database operations

- **preload.js** - Security bridge
  - Exposes safe database API to renderer process
  - Prevents direct Node.js access from UI
  - Implements context isolation

- **package.json** - Project configuration
  - Dependencies: electron, better-sqlite3
  - Scripts: start, dev, build
  - App metadata

### UI & Logic
- **index-electron.html** - Application interface
  - Removed load data screen (not needed with database)
  - All modals and views
  - Optimized for Electron

- **app-db.js** - Data management layer
  - TeamManager class with database integration
  - Async methods for all database operations
  - Fallback to localStorage for web version

- **ui-manager.js** - User interface logic
  - UIManager class for rendering and events
  - All modal handling
  - CSV import/export functionality
  - Email integration

- **styles.css** - Application styling
  - Unchanged from original
  - Grade color coding
  - Responsive layout

### Configuration & Documentation
- **electron-builder.yml** - Build configuration
  - Windows installer (NSIS)
  - macOS DMG
  - Linux AppImage
  - Portable executable

- **README.md** - Full documentation
  - Features overview
  - Installation instructions
  - Usage guide
  - Database schema

- **QUICKSTART.md** - Quick reference
  - First-time setup
  - Common tasks
  - Troubleshooting

- **ELECTRON_MIGRATION.md** - Migration guide
  - What changed from web version
  - Database schema
  - Data migration path

- **.gitignore** - Git ignore rules
  - Excludes node_modules, dist, database files

## Legacy Files (Keep for Reference)

- **app.js** - Original web version (can be deleted)
- **index.html** - Original web version (can be deleted)
- **team_data.csv** - Sample data (can be imported)

## Database Files (Auto-Created)

- **team-manager.db** - SQLite database
  - Created automatically on first run
  - Located in app user data directory
  - Contains all employees, training, objectives, tasks

## Directory Structure After npm install

```
project/
├── node_modules/          (created by npm install)
│   ├── electron/
│   ├── better-sqlite3/
│   └── ...
├── .vscode/
├── main.js
├── preload.js
├── app-db.js
├── ui-manager.js
├── index-electron.html
├── styles.css
├── package.json
├── package-lock.json      (created by npm install)
├── electron-builder.yml
├── README.md
├── QUICKSTART.md
├── ELECTRON_MIGRATION.md
├── PROJECT_STRUCTURE.md
├── .gitignore
├── app.js                 (legacy)
├── index.html             (legacy)
└── team_data.csv          (sample data)
```

## Data Flow

```
User Interaction (UI)
        ↓
    ui-manager.js (event handlers)
        ↓
    app-db.js (TeamManager class)
        ↓
    preload.js (IPC bridge)
        ↓
    main.js (IPC handlers)
        ↓
    SQLite Database
```

## Key Technologies

- **Electron** - Desktop app framework
- **SQLite** - Local database (via better-sqlite3)
- **Node.js** - Runtime environment
- **Vanilla JavaScript** - No frameworks needed
- **HTML/CSS** - UI markup and styling

## File Sizes (Approximate)

- main.js - 8 KB
- preload.js - 1 KB
- app-db.js - 6 KB
- ui-manager.js - 18 KB
- index-electron.html - 12 KB
- styles.css - 8 KB
- package.json - 0.5 KB

Total source code: ~53 KB (very lightweight!)

## Next Steps

1. Run `npm install` to download dependencies
2. Run `npm start` to launch the app
3. Import your existing data if you have it
4. Start using the app!

For distribution, run `npm run build` to create installers.
