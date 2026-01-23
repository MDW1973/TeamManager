import { TasksData, DailyTask, RecurringTask, WorkHours } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

let dataPath: string;

export function initializeDataPath(): void {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  dataPath = path.join(userDataPath, 'tasks-data.json');
}

export function loadTasksData(): TasksData {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading tasks data:', e);
  }
  return { tasks: [], recurringTasks: [], workHours: [] };
}

export function saveTasksData(data: TasksData): void {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving tasks data:', e);
  }
}

export function addTask(task: DailyTask): void {
  const data = loadTasksData();
  data.tasks.push(task);
  saveTasksData(data);
}

export function updateTask(id: string, updates: Partial<DailyTask>): void {
  const data = loadTasksData();
  const taskIndex = data.tasks.findIndex(t => t.id === id);
  if (taskIndex !== -1) {
    data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
    saveTasksData(data);
  }
}

export function deleteTask(id: string): void {
  const data = loadTasksData();
  data.tasks = data.tasks.filter(t => t.id !== id);
  saveTasksData(data);
}

export function getTasksForDate(date: string): DailyTask[] {
  const data = loadTasksData();
  return data.tasks.filter(t => t.date === date);
}

export function addRecurringTask(task: RecurringTask): void {
  const data = loadTasksData();
  data.recurringTasks.push(task);
  saveTasksData(data);
}

export function updateRecurringTask(id: string, updates: Partial<RecurringTask>): void {
  const data = loadTasksData();
  const taskIndex = data.recurringTasks.findIndex(t => t.id === id);
  if (taskIndex !== -1) {
    data.recurringTasks[taskIndex] = { ...data.recurringTasks[taskIndex], ...updates };
    saveTasksData(data);
  }
}

export function deleteRecurringTask(id: string): void {
  const data = loadTasksData();
  data.recurringTasks = data.recurringTasks.filter(t => t.id !== id);
  saveTasksData(data);
}

export function getAllRecurringTasks(): RecurringTask[] {
  const data = loadTasksData();
  return data.recurringTasks;
}

export function getAllTasks(): DailyTask[] {
  const data = loadTasksData();
  return data.tasks;
}

export function addWorkHours(workHours: WorkHours): void {
  const data = loadTasksData();
  data.workHours.push(workHours);
  saveTasksData(data);
}

export function updateWorkHours(id: string, updates: Partial<WorkHours>): void {
  const data = loadTasksData();
  const index = data.workHours.findIndex(w => w.id === id);
  if (index !== -1) {
    data.workHours[index] = { ...data.workHours[index], ...updates };
    saveTasksData(data);
  }
}

export function deleteWorkHours(id: string): void {
  const data = loadTasksData();
  data.workHours = data.workHours.filter(w => w.id !== id);
  saveTasksData(data);
}

export function getWorkHoursForDate(date: string): WorkHours | undefined {
  const data = loadTasksData();
  return data.workHours.find(w => w.date === date);
}
