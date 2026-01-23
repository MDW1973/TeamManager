# Migration to Electron App

## What Changed

Your Team Manager app has been converted from a web-based app with CSV/localStorage to a proper Electron desktop application with SQLite database.

## Key Improvements

### Data Storage
- **Before**: CSV files + browser localStorage (5-10MB limit, lost on cache clear)
- **After**: SQLite database (unlimited size, persistent, reliable)

### Reliability
- **Before**: Manual import/export, fragile CSV parsing
- **After**: Automatic database persistence, structured data

### Performance
- **Before**: All data in memory, slow with large teams
- **After**: Efficient database queries, scales to thousands of employees

### User Experience
- **Before**: Load data screen on every startup
- **After**: App opens directly to org chart, data always available

## File Changes

### New Files
- `main.js` - Electron main process with database setup
- `preload.js` - Secure IPC communication
- `app-db.js` - Database-aware data layer
- `ui-manager.js` - UI logic (extracted from app.js)
- `index-electron.html` - Optimized HTML for Electron
- `package.json` - Node.js project configuration
- `README.md` - Setup and usage documentation

### Kept Files
- `styles.css` - Unchanged, same styling
- `team_data.csv` - Can still be imported for migration

### Deprecated Files
- `app.js` - Replaced by `app-db.js` and `ui-manager.js`
- `index.html` - Replaced by `index-electron.html`

## Database Schema

The app uses SQLite with these tables:

```sql
employees
├── id (TEXT PRIMARY KEY)
├── name, position, grade, department
├── manager_id (foreign key)
├── email, list_reports_vertically
└── timestamps

training
├── id (TEXT PRIMARY KEY)
├── employee_id (foreign key)
├── name, type, date

objectives
├── id (TEXT PRIMARY KEY)
├── employee_id (foreign key)
├── text, date

tasks
├── id (TEXT PRIMARY KEY)
├── employee_id (foreign key)
├── text, priority, completed
```

## Migration Path

If you have existing data in `team_data.csv`:

1. Start the Electron app
2. Go to Admin panel
3. Click "⬆️ Import"
4. Select your `team_data.csv` file
5. Data will be imported into the database

## Getting Started

```bash
# Install dependencies
npm install

# Run the app
npm start

# For development with DevTools
npm run dev

# Build for distribution
npm run build
```

## Data Location

Your database file is stored in the app's user data directory:
- Windows: `%APPDATA%\team-manager\team-manager.db`
- macOS: `~/Library/Application Support/team-manager/team-manager.db`
- Linux: `~/.config/team-manager/team-manager.db`

You can still export to CSV anytime from the Admin panel for backups.

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm start` to launch the app
3. Import your existing `team_data.csv` if you have one
4. Start using the app - all data is automatically saved!

No more manual saves or worrying about data loss. The database handles everything.
