# Windows Setup Guide

## Prerequisites

### 1. Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer
4. Accept all defaults
5. Restart your computer

### 2. Verify Installation

Open Command Prompt and run:
```cmd
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0, 9.6.7)

## Setup Team Manager

### 1. Navigate to Project Folder

Open Command Prompt and go to your project folder:
```cmd
cd C:\path\to\TeamManager
```

### 2. Install Dependencies

```cmd
npm install
```

This will:
- Download Electron (~150 MB)
- Download better-sqlite3 (~5 MB)
- Download other dependencies
- Takes 2-5 minutes depending on internet speed

You'll see a lot of text - this is normal. Wait for it to complete.

### 3. Start the App

```cmd
npm start
```

The Team Manager window should open. If it doesn't:
- Check Command Prompt for error messages
- Make sure you're in the correct folder
- Try running again

## First Run

1. The app opens to the Organization Chart view
2. Click "+ Add Employee" to start adding your team
3. All data is automatically saved to the database

## Importing Existing Data

If you have a `team_data.csv` file:

1. Click **👥 Admin** button
2. Click **⬆️ Import**
3. Select your CSV file
4. Your data will be imported

## Development Mode

To see developer tools (for debugging):
```cmd
npm run dev
```

## Building an Installer

To create a Windows installer:
```cmd
npm run build
```

This creates:
- `Team Manager Setup 1.0.0.exe` - Full installer
- `Team Manager 1.0.0.exe` - Portable version

Both are in the `dist` folder.

## Troubleshooting

### "npm is not recognized"
- Node.js wasn't installed correctly
- Restart your computer after installing Node.js
- Reinstall Node.js if needed

### "Cannot find module 'electron'"
- Run `npm install` again
- Make sure you're in the correct project folder
- Check that `node_modules` folder was created

### App won't start
- Check Command Prompt for error messages
- Try running `npm start` again
- Restart your computer

### Database file location
The database is stored at:
```
C:\Users\[YourUsername]\AppData\Roaming\team-manager\team-manager.db
```

You can access it through File Explorer:
1. Press `Win + R`
2. Type: `%APPDATA%\team-manager`
3. Press Enter

## Updating the App

To get the latest version:
1. Download the new files
2. Replace the old files (except `team-manager.db`)
3. Run `npm install` again
4. Run `npm start`

Your data in the database will be preserved.

## Uninstalling

### If using the installer:
1. Go to Control Panel → Programs → Programs and Features
2. Find "Team Manager"
3. Click Uninstall

### If using portable version:
- Just delete the .exe file

### To keep your data:
- Before uninstalling, export your data:
  1. Open the app
  2. Go to Admin panel
  3. Click Export
  4. Save the CSV file somewhere safe

## Getting Help

If you encounter issues:
1. Check the error message in Command Prompt
2. Try restarting the app
3. Try restarting your computer
4. Reinstall Node.js if needed

## Next Steps

1. Run `npm install`
2. Run `npm start`
3. Start adding your team!

All data is automatically saved. No more manual exports needed.
