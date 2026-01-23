# Manager Pro v1.0.0

A unified React + TypeScript Electron desktop application for team management and daily task tracking.

## Features

### Team Manager
- Organization chart with hierarchical employee structure
- Employee management (add, edit, delete)
- Training & certifications tracking
- Appraisal and one-to-one objectives
- Manager assignment and reporting structure

### Daily Task Manager
- Daily task creation and management with priorities
- Recurring tasks (Daily, Weekly, Monthly)
- Task rollover for incomplete items
- Date navigation

### Working Hours
- Login/logout tracking from Windows Event Log
- Weekly view (Mon-Fri by default, expandable)
- 30-minute break deduction
- Copy to clipboard for spreadsheet export

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Windows 10/11

### Setup
```bash
npm install
npm run electron:dev
```

### Build
```bash
npm run build              # Development build
npm run electron:dist      # Production build with installer
```

## Project Structure

```
src/
├── main.ts                 # Electron main process
├── preload.ts              # IPC bridge
├── types/index.ts          # TypeScript definitions
├── services/               # Data persistence
└── renderer/               # React UI
    ├── App.tsx
    └── components/
        ├── Sidebar.tsx
        ├── TeamManager.tsx
        ├── DailyTasks.tsx
        └── WorkingHours.tsx
```

## Data Storage

- **Team Data**: `%APPDATA%\manager-pro\team-data.json`
- **Tasks Data**: `%APPDATA%\manager-pro\tasks-data.json`
- **Work Hours**: Retrieved from Windows Event Log

## Development

### Available Scripts
- `npm run dev` - Webpack watch mode
- `npm run build` - Production build
- `npm run electron:dev` - Start dev app
- `npm run electron:dist` - Build installer

## License

MIT
