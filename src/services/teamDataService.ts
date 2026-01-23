import { TeamData, Employee } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

let dataPath: string;

export function initializeDataPath(): void {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  dataPath = path.join(userDataPath, 'team-data.json');
}

export function loadTeamData(): TeamData {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading team data:', e);
  }
  return { employees: {} };
}

export function saveTeamData(data: TeamData): void {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving team data:', e);
  }
}

export function addEmployee(employee: Employee): void {
  const data = loadTeamData();
  data.employees[employee.id] = employee;
  saveTeamData(data);
}

export function updateEmployee(id: string, updates: Partial<Employee>): void {
  const data = loadTeamData();
  if (data.employees[id]) {
    data.employees[id] = { ...data.employees[id], ...updates };
    saveTeamData(data);
  }
}

export function deleteEmployee(id: string): void {
  const data = loadTeamData();
  delete data.employees[id];
  saveTeamData(data);
}

export function getEmployee(id: string): Employee | undefined {
  const data = loadTeamData();
  return data.employees[id];
}

export function getAllEmployees(): Employee[] {
  const data = loadTeamData();
  return Object.values(data.employees);
}
