# Quick Start Guide

## Installation (First Time Only)

1. Open Command Prompt or PowerShell in the project folder
2. Run:
   ```bash
   npm install
   ```
   This downloads all required dependencies (takes 2-3 minutes)

## Running the App

```bash
npm start
```

The app will launch in a window. All your data is automatically saved to the database.

## First Time Setup

1. **Add your first employee** - Click "+ Add Employee"
2. **Build your org chart** - Add more employees and set their managers
3. **Add training records** - Click on an employee and add training/certifications
4. **Set objectives** - Add objectives with target dates
5. **Create tasks** - Add 1-2-1 session tasks

## Importing Existing Data

If you have a `team_data.csv` file from the old version:

1. Go to **Admin** panel (👥 button)
2. Click **⬆️ Import**
3. Select your CSV file
4. Done! Your data is now in the database

## Common Tasks

### View Organization Chart
- Click **Team Organization Chart** or the back button
- Click on any employee card to see details

### Manage an Employee
1. Click on their card in the org chart
2. Edit their information, training, objectives, or tasks
3. Changes save automatically

### Export Data
1. Go to **Admin** panel
2. Click **⬇️ Export**
3. A CSV file downloads for backup

### Email Tasks/Objectives
1. Click on an employee
2. Click **📧 Email Tasks** or **📧 Email Objectives**
3. Your email client opens with pre-filled content

## Tips

- **Vertical Layout**: For managers with many reports, check "List reports vertically" in their details
- **Sorting**: Click column headers in Admin panel to sort
- **Grades**: Use the grade system (PO6, PO4, PO2, SO1, A3, Contractor, Student) for color-coded org chart
- **Backups**: Export to CSV regularly for backups

## Troubleshooting

**App won't start?**
- Make sure you ran `npm install` first
- Check that Node.js is installed: `node --version`

**Data not saving?**
- Data saves automatically to the database
- Check that the app didn't crash (look for error messages)

**Import not working?**
- Make sure CSV format matches the export format
- Check that employee names match exactly

## Development

To see developer tools:
```bash
npm run dev
```

## Building for Distribution

To create an installer:
```bash
npm run build
```

This creates an installer in the `dist` folder that you can share with others.

---

That's it! You're ready to go. Start adding your team and enjoy automatic data persistence.
