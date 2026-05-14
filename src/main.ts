import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as teamDataService from './services/teamDataService';
import * as tasksDataService from './services/tasksDataService';
import { TeamData, TasksData, Employee, DailyTask, Training } from './types';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MsgReader = require('msgreader').default;

let mainWindow: BrowserWindow | null = null;

function autoLoadCSVIfNeeded(): void {
  const teamData = teamDataService.loadTeamData();
  
  // Only auto-load if no employees exist
  if (Object.keys(teamData.employees).length === 0) {
    const csvPath = path.join(app.getAppPath(), 'team_data.csv');
    
    // Try to find team_data.csv in common locations
    const possiblePaths = [
      csvPath,
      path.join(process.cwd(), 'team_data.csv'),
      path.join(app.getPath('documents'), 'team_data.csv'),
      path.join(app.getPath('home'), 'team_data.csv')
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          const csv = fs.readFileSync(filePath, 'utf8');
          parseAndLoadCSV(csv);
          console.log('Auto-loaded CSV data from:', filePath);
          return;
        } catch (error) {
          console.error('Error auto-loading CSV:', error);
        }
      }
    }
  }
}

function parseAndLoadCSV(csv: string): void {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return;

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const typeIdx = headers.indexOf('type');
  const nameIdx = headers.indexOf('name');
  const positionIdx = headers.indexOf('position');
  const gradeIdx = headers.indexOf('grade');
  const departmentIdx = headers.indexOf('department');
  const managerIdx = headers.indexOf('manager');
  const emailIdx = headers.indexOf('email');
  const employeeNameIdx = headers.indexOf('employeename');
  const taskIdx = headers.indexOf('task');
  const priorityIdx = headers.indexOf('priority');
  const trainingNameIdx = headers.indexOf('trainingname');
  const trainingTypeIdx = headers.indexOf('trainingtype');
  const trainingDateIdx = headers.indexOf('trainingdate');
  const objectiveIdx = headers.indexOf('objective');

  const employees: Record<string, Employee> = {};
  const employeeNameMap: Record<string, string> = {};

  // First pass: collect all employees
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''));
    const type = typeIdx !== -1 ? fields[typeIdx] : '';

    if (type === 'EMPLOYEE') {
      const name = nameIdx !== -1 ? fields[nameIdx] : '';
      if (!name) continue;

      const id = Date.now().toString() + Math.random();
      const employee: Employee = {
        id,
        name,
        position: positionIdx !== -1 ? fields[positionIdx] : '',
        grade: gradeIdx !== -1 ? fields[gradeIdx] : '',
        department: departmentIdx !== -1 ? fields[departmentIdx] : '',
        manager: null,
        email: emailIdx !== -1 ? fields[emailIdx] : '',
        listReportsVertically: false,
        training: [],
        objectives: [],
        oneToOneObjectives: []
      };

      employees[id] = employee;
      employeeNameMap[name] = id;
    }
  }

  // Link managers
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''));
    const type = typeIdx !== -1 ? fields[typeIdx] : '';

    if (type === 'EMPLOYEE') {
      const name = nameIdx !== -1 ? fields[nameIdx] : '';
      const managerName = managerIdx !== -1 ? fields[managerIdx] : '';

      if (name && managerName && employeeNameMap[name] && employeeNameMap[managerName]) {
        employees[employeeNameMap[name]].manager = employeeNameMap[managerName];
      }
    }
  }

  // Second pass: collect training
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''));
    const type = typeIdx !== -1 ? fields[typeIdx] : '';

    if (type === 'TRAINING') {
      const employeeName = employeeNameIdx !== -1 ? fields[employeeNameIdx] : '';
      const trainingName = trainingNameIdx !== -1 ? fields[trainingNameIdx] : '';
      const trainingType = trainingTypeIdx !== -1 ? fields[trainingTypeIdx] : 'Training';
      const trainingDate = trainingDateIdx !== -1 ? fields[trainingDateIdx] : '';

      if (employeeName && trainingName && employeeNameMap[employeeName]) {
        const training: Training = {
          id: Date.now().toString() + Math.random(),
          name: trainingName,
          type: (trainingType as 'Training' | 'Certification') || 'Training',
          date: trainingDate
        };

        employees[employeeNameMap[employeeName]].training.push(training);
      }
    }
  }

  // Save all data
  const teamData: TeamData = { employees };
  teamDataService.saveTeamData(teamData);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'default',
    frame: true,
    show: false,
    backgroundColor: '#ffffff'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      if (process.platform === 'win32') {
        mainWindow.focus();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle file drops at the webContents level so Electron exposes file paths
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent navigation when files are dropped on the window
    if (url.startsWith('file://') && url.endsWith('.msg')) {
      event.preventDefault();
    }
  });

  // Pass dropped .msg file paths to the renderer
  mainWindow.webContents.session.on('will-download', (event, item) => {
    // Not needed but keeps session clean
  });

  createApplicationMenu();
  setupIpcHandlers();
}

function setupIpcHandlers(): void {
  // Team Data IPC Handlers
  ipcMain.handle('team:load', () => {
    return teamDataService.loadTeamData();
  });

  ipcMain.handle('team:save', (event, data: TeamData) => {
    teamDataService.saveTeamData(data);
    return true;
  });

  ipcMain.handle('team:addEmployee', (event, employee) => {
    teamDataService.addEmployee(employee);
    return true;
  });

  ipcMain.handle('team:updateEmployee', (event, id: string, updates) => {
    teamDataService.updateEmployee(id, updates);
    return true;
  });

  ipcMain.handle('team:deleteEmployee', (event, id: string) => {
    teamDataService.deleteEmployee(id);
    return true;
  });

  ipcMain.handle('team:getEmployee', (event, id: string) => {
    return teamDataService.getEmployee(id);
  });

  ipcMain.handle('team:getAllEmployees', () => {
    return teamDataService.getAllEmployees();
  });

  // Tasks Data IPC Handlers
  ipcMain.handle('tasks:load', () => {
    return tasksDataService.loadTasksData();
  });

  ipcMain.handle('tasks:save', (event, data: TasksData) => {
    tasksDataService.saveTasksData(data);
    return true;
  });

  ipcMain.handle('tasks:addTask', (event, task) => {
    tasksDataService.addTask(task);
    return true;
  });

  ipcMain.handle('tasks:updateTask', (event, id: string, updates) => {
    tasksDataService.updateTask(id, updates);
    return true;
  });

  ipcMain.handle('tasks:deleteTask', (event, id: string) => {
    tasksDataService.deleteTask(id);
    return true;
  });

  ipcMain.handle('tasks:getTasksForDate', (event, date: string) => {
    return tasksDataService.getTasksForDate(date);
  });

  ipcMain.handle('tasks:getAllTasks', () => {
    return tasksDataService.getAllTasks();
  });

  ipcMain.handle('tasks:addRecurringTask', (event, task) => {
    tasksDataService.addRecurringTask(task);
    return true;
  });

  ipcMain.handle('tasks:updateRecurringTask', (event, id: string, updates) => {
    tasksDataService.updateRecurringTask(id, updates);
    return true;
  });

  ipcMain.handle('tasks:deleteRecurringTask', (event, id: string) => {
    tasksDataService.deleteRecurringTask(id);
    return true;
  });

  ipcMain.handle('tasks:getAllRecurringTasks', () => {
    return tasksDataService.getAllRecurringTasks();
  });

  ipcMain.handle('tasks:addWorkHours', (event, workHours) => {
    tasksDataService.addWorkHours(workHours);
    return true;
  });

  ipcMain.handle('tasks:updateWorkHours', (event, id: string, updates) => {
    tasksDataService.updateWorkHours(id, updates);
    return true;
  });

  ipcMain.handle('tasks:deleteWorkHours', (event, id: string) => {
    tasksDataService.deleteWorkHours(id);
    return true;
  });

  ipcMain.handle('tasks:getWorkHoursForDate', (event, date: string) => {
    return tasksDataService.getWorkHoursForDate(date);
  });

  // System API
  ipcMain.handle('system:runPowerShell', (event, command: string) => {
    try {
      const result = execSync(command, { encoding: 'utf8' });
      return result;
    } catch (error) {
      throw new Error(`PowerShell execution failed: ${error}`);
    }
  });

  // Outlook .msg file reader
  ipcMain.handle('system:readMsgFile', (event, filePath: string) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const reader = new MsgReader(buffer);
      const fileData = reader.getFileData();
      return {
        subject: fileData.subject || '',
        senderName: fileData.senderName || '',
        senderEmail: fileData.senderSmtpAddress || fileData.senderEmail || ''
      };
    } catch (error) {
      throw new Error(`Failed to read .msg file: ${error}`);
    }
  });
}

function createApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  teamDataService.initializeDataPath();
  tasksDataService.initializeDataPath();
  autoLoadCSVIfNeeded();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
