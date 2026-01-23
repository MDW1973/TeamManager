# Changelog

## [1.0.0] - 2026-01-23

### Initial Release

#### Features
- **Team Manager Module**
  - Organization chart with hierarchical employee structure
  - Employee management (add, edit, delete)
  - Employee details: position, grade, department, email
  - Training & certifications tracking
  - Appraisal objectives management
  - One-to-one objectives tracking
  - Manager assignment and reporting structure

- **Daily Task Manager Module**
  - Daily task creation and management
  - Task priorities (Low, Medium, High)
  - Task completion tracking
  - Date navigation
  - Recurring tasks (Daily, Weekly, Monthly patterns)
  - Task rollover for incomplete items
  - Task editing with future instance updates

- **Working Hours Tracking**
  - Login/logout time tracking from Windows Event Log
  - Weekly organization (Monday-Sunday)
  - Mon-Fri view by default, expandable to full week
  - 30-minute break deduction (12:00 PM - 12:30 PM)
  - Copy to clipboard for spreadsheet export
  - Tab-separated format for easy pasting

#### Technical
- React 18 + TypeScript
- Electron desktop application
- File-based JSON storage
- IPC communication between main and renderer processes
- Webpack bundling
- Electron Builder for packaging

#### Data Persistence
- Team data: `%APPDATA%\manager-pro\team-data.json`
- Tasks data: `%APPDATA%\manager-pro\tasks-data.json`
- Work hours: Retrieved from Windows Event Log (no local storage)

#### Build & Distribution
- Production build: `npm run build`
- Package application: `npm run electron:dist`
- Portable .exe in `release/win-unpacked/`
