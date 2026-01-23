# Documentation Index

## 📖 Read These First

### 1. **START_HERE.md** ⭐ START HERE
   - Quick overview of what was done
   - 3-step setup process
   - Common commands
   - Troubleshooting basics
   - **Read this first if you're new**

### 2. **QUICKSTART.md**
   - First-time setup
   - Common tasks (add employee, import data, export, etc.)
   - Tips and tricks
   - Troubleshooting
   - **Read this to learn how to use the app**

### 3. **SETUP_WINDOWS.md**
   - Detailed Windows setup guide
   - Node.js installation
   - Step-by-step instructions
   - Troubleshooting for Windows
   - **Read this if you're on Windows**

## 📚 Reference Documentation

### 4. **README.md**
   - Complete feature list
   - Installation instructions
   - Usage guide
   - Grade system explanation
   - Database schema
   - **Read this for comprehensive documentation**

### 5. **ELECTRON_MIGRATION.md**
   - What changed from web version
   - Why we switched to Electron
   - Database schema explanation
   - Data migration path
   - **Read this to understand the changes**

### 6. **PROJECT_STRUCTURE.md**
   - File-by-file breakdown
   - Data flow diagram
   - Technology stack
   - File sizes
   - **Read this to understand the code structure**

### 7. **IMPLEMENTATION_CHECKLIST.md**
   - Complete checklist of what was built
   - Testing checklist
   - Comparison table (web vs Electron)
   - **Read this to verify everything is working**

## 🔧 Technical Documentation

### 8. **main.js**
   - Electron main process
   - Database initialization
   - IPC handlers
   - Window creation
   - **Code file - read if you need to modify the backend**

### 9. **preload.js**
   - Security bridge
   - IPC API exposure
   - Context isolation
   - **Code file - read if you need to modify security**

### 10. **app-db.js**
   - TeamManager class
   - Database integration
   - Async methods
   - **Code file - read if you need to modify data layer**

### 11. **ui-manager.js**
   - UIManager class
   - Event handling
   - Rendering logic
   - CSV import/export
   - **Code file - read if you need to modify UI**

### 12. **package.json**
   - Project metadata
   - Dependencies
   - Scripts
   - **Config file - modify to add dependencies**

### 13. **electron-builder.yml**
   - Build configuration
   - Installer settings
   - Platform-specific options
   - **Config file - modify to change build settings**

## 📋 Quick Reference

### Setup
```bash
npm install      # Install dependencies (one time)
npm start        # Start the app
npm run dev      # Start with developer tools
npm run build    # Build installer
```

### File Organization
```
Core Files:
  main.js              - Electron engine
  app-db.js            - Data management
  ui-manager.js        - UI logic
  index-electron.html  - App interface
  styles.css           - Styling

Config Files:
  package.json         - Project config
  electron-builder.yml - Build config
  .gitignore           - Git ignore

Documentation:
  START_HERE.md        - Quick start
  README.md            - Full docs
  QUICKSTART.md        - Quick reference
  SETUP_WINDOWS.md     - Windows setup
  (and more...)
```

### Database Location
```
Windows: C:\Users\[YourUsername]\AppData\Roaming\team-manager\team-manager.db
macOS:   ~/Library/Application Support/team-manager/team-manager.db
Linux:   ~/.config/team-manager/team-manager.db
```

## 🎯 By Use Case

### "I just want to use the app"
1. Read: **START_HERE.md**
2. Run: `npm install` then `npm start`
3. Done!

### "I want to understand what changed"
1. Read: **ELECTRON_MIGRATION.md**
2. Read: **PROJECT_STRUCTURE.md**
3. Skim: **README.md**

### "I'm having setup issues"
1. Read: **SETUP_WINDOWS.md** (if on Windows)
2. Check: **QUICKSTART.md** troubleshooting section
3. Check: **START_HERE.md** troubleshooting section

### "I want to modify the code"
1. Read: **PROJECT_STRUCTURE.md**
2. Read: **IMPLEMENTATION_CHECKLIST.md**
3. Read the relevant code file (main.js, app-db.js, ui-manager.js, etc.)

### "I want to build an installer"
1. Read: **README.md** (Building section)
2. Modify: **electron-builder.yml** if needed
3. Run: `npm run build`

### "I want to deploy to other computers"
1. Run: `npm run build`
2. Share the installer from the `dist` folder
3. Users run the installer
4. Their data is stored locally

## 📞 Support

If you get stuck:

1. **Check the relevant documentation** above
2. **Search for your error** in the troubleshooting sections
3. **Check Command Prompt output** for error messages
4. **Try restarting** the app or your computer
5. **Reinstall Node.js** if needed

## ✅ Verification

To verify everything is set up correctly:

1. Run `npm install` - should complete without errors
2. Run `npm start` - app should open
3. Click "+ Add Employee" - should open a form
4. Fill in details and click "Save Employee" - should appear in org chart
5. Go to Admin panel - should see employee in table
6. Click Export - should download a CSV file

If all these work, you're good to go!

## 🎉 You're Ready!

Everything is set up and documented. Just:

1. Run `npm install`
2. Run `npm start`
3. Start using your app!

All your data is automatically saved. No more manual exports needed.

---

**Questions?** Check the relevant documentation above. Everything is documented!
