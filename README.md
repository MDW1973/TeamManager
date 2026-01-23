# Team Manager - Electron App

A desktop application for managing team structures, employee details, training records, objectives, and 1-2-1 session tasks.

## Features

- **Organization Chart** - Visual hierarchical team structure
- **Employee Management** - Add, edit, delete employees with grades and departments
- **Training & Certifications** - Track training courses and certifications with dates
- **Objectives** - Set and track employee objectives with target dates
- **1-2-1 Session Tasks** - Manage tasks for upcoming 1-2-1 sessions
- **Admin Panel** - Sortable employee table with bulk actions
- **Data Persistence** - All data stored in local SQLite database
- **Import/Export** - CSV import/export for data backup and migration

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the app:
```bash
npm start
```

For development with DevTools:
```bash
npm run dev
```

## Building

To create a distributable package:
```bash
npm run build
```

This will create an installer in the `dist` folder.

## Data Storage

All data is stored in a local SQLite database located at:
- **Windows**: `%APPDATA%\team-manager\team-manager.db`
- **macOS**: `~/Library/Application Support/team-manager/team-manager.db`
- **Linux**: `~/.config/team-manager/team-manager.db`

## File Structure

- `main.js` - Electron main process and database handlers
- `preload.js` - Secure IPC bridge between renderer and main process
- `app-db.js` - Data management layer with database integration
- `ui-manager.js` - UI rendering and event handling
- `index-electron.html` - Application UI
- `styles.css` - Application styling
- `package.json` - Project dependencies and scripts

## Usage

### Adding Employees
1. Click "+ Add Employee" button
2. Fill in employee details (name, position, grade, department, manager, email)
3. Click "Save Employee"

### Managing Training
1. Click on an employee to view details
2. Click "+ Add" in the Training & Certifications section
3. Enter training name, type (Training/Certification), and completion date
4. Click "Add Training"

### Setting Objectives
1. Click on an employee to view details
2. Click "+ Add" in the Objectives section
3. Enter objective text and target date
4. Click "Add Objective"

### 1-2-1 Session Tasks
1. Click on an employee to view details
2. Click "+ Add" in the 1-2-1 Session Tasks section
3. Enter task description and priority level
4. Click "Add Task"
5. Check off completed tasks
6. Use "📧 Email Tasks" to send tasks to employee

### Exporting Data
1. Go to Admin panel
2. Click "⬇️ Export" to download CSV backup

### Importing Data
1. Go to Admin panel
2. Click "⬆️ Import" and select a CSV file
3. Data will be merged with existing records

## Grade System

- **PO6** - Senior leadership (Gold)
- **PO4** - Lead/Principal (Silver)
- **PO2** - Senior specialist (Bronze)
- **SO1** - Specialist (Blue)
- **A3** - Associate/Apprentice (Orange)
- **Contractor** - External contractor (Purple)
- **Student** - Student/Intern (Green)

## License

MIT
