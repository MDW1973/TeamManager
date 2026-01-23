import { contextBridge, ipcRenderer } from 'electron';
import { TeamData, TasksData, Employee, DailyTask, RecurringTask, WorkHours } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Team Data API
  team: {
    load: () => ipcRenderer.invoke('team:load'),
    save: (data: TeamData) => ipcRenderer.invoke('team:save', data),
    addEmployee: (employee: Employee) => ipcRenderer.invoke('team:addEmployee', employee),
    updateEmployee: (id: string, updates: Partial<Employee>) => ipcRenderer.invoke('team:updateEmployee', id, updates),
    deleteEmployee: (id: string) => ipcRenderer.invoke('team:deleteEmployee', id),
    getEmployee: (id: string) => ipcRenderer.invoke('team:getEmployee', id),
    getAllEmployees: () => ipcRenderer.invoke('team:getAllEmployees')
  },
  // Tasks Data API
  tasks: {
    load: () => ipcRenderer.invoke('tasks:load'),
    save: (data: TasksData) => ipcRenderer.invoke('tasks:save', data),
    addTask: (task: DailyTask) => ipcRenderer.invoke('tasks:addTask', task),
    updateTask: (id: string, updates: Partial<DailyTask>) => ipcRenderer.invoke('tasks:updateTask', id, updates),
    deleteTask: (id: string) => ipcRenderer.invoke('tasks:deleteTask', id),
    getTasksForDate: (date: string) => ipcRenderer.invoke('tasks:getTasksForDate', date),
    getAllTasks: () => ipcRenderer.invoke('tasks:getAllTasks'),
    addRecurringTask: (task: RecurringTask) => ipcRenderer.invoke('tasks:addRecurringTask', task),
    updateRecurringTask: (id: string, updates: Partial<RecurringTask>) => ipcRenderer.invoke('tasks:updateRecurringTask', id, updates),
    deleteRecurringTask: (id: string) => ipcRenderer.invoke('tasks:deleteRecurringTask', id),
    getAllRecurringTasks: () => ipcRenderer.invoke('tasks:getAllRecurringTasks'),
    addWorkHours: (workHours: WorkHours) => ipcRenderer.invoke('tasks:addWorkHours', workHours),
    updateWorkHours: (id: string, updates: Partial<WorkHours>) => ipcRenderer.invoke('tasks:updateWorkHours', id, updates),
    deleteWorkHours: (id: string) => ipcRenderer.invoke('tasks:deleteWorkHours', id),
    getWorkHoursForDate: (date: string) => ipcRenderer.invoke('tasks:getWorkHoursForDate', date)
  },
  // System API
  runPowerShell: (command: string) => ipcRenderer.invoke('system:runPowerShell', command)
});

declare global {
  interface Window {
    electronAPI: {
      team: {
        load: () => Promise<TeamData>;
        save: (data: TeamData) => Promise<boolean>;
        addEmployee: (employee: Employee) => Promise<boolean>;
        updateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
        deleteEmployee: (id: string) => Promise<boolean>;
        getEmployee: (id: string) => Promise<Employee | undefined>;
        getAllEmployees: () => Promise<Employee[]>;
      };
      tasks: {
        load: () => Promise<TasksData>;
        save: (data: TasksData) => Promise<boolean>;
        addTask: (task: DailyTask) => Promise<boolean>;
        updateTask: (id: string, updates: Partial<DailyTask>) => Promise<boolean>;
        deleteTask: (id: string) => Promise<boolean>;
        getTasksForDate: (date: string) => Promise<DailyTask[]>;
        getAllTasks: () => Promise<DailyTask[]>;
        addRecurringTask: (task: RecurringTask) => Promise<boolean>;
        updateRecurringTask: (id: string, updates: Partial<RecurringTask>) => Promise<boolean>;
        deleteRecurringTask: (id: string) => Promise<boolean>;
        getAllRecurringTasks: () => Promise<RecurringTask[]>;
        addWorkHours: (workHours: WorkHours) => Promise<boolean>;
        updateWorkHours: (id: string, updates: Partial<WorkHours>) => Promise<boolean>;
        deleteWorkHours: (id: string) => Promise<boolean>;
        getWorkHoursForDate: (date: string) => Promise<WorkHours | undefined>;
      };
      runPowerShell: (command: string) => Promise<string>;
    };
  }
}
