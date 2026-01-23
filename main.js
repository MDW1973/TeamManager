const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { initializeWithCSV } = require('./init-data');

let mainWindow;
let dataPath;

// Get data file path
function getDataPath() {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'team-data.json');
}

// Load data from file
function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
    return {};
}

// Save data to file
function saveData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Create window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');
    
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// IPC Handlers for data persistence
ipcMain.handle('data:load', () => {
    return loadData();
});

ipcMain.handle('data:save', (event, data) => {
    saveData(data);
    return true;
});

// App lifecycle
app.on('ready', () => {
    dataPath = getDataPath();
    initializeWithCSV();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
