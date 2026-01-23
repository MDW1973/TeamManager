// Team Manager Types
export interface Employee {
  id: string;
  name: string;
  position: string;
  grade: string;
  department: string;
  manager: string | null;
  email: string;
  listReportsVertically: boolean;
  training: Training[];
  objectives: Objective[];
  oneToOneObjectives: OneToOneObjective[];
}

export interface Training {
  id: string;
  name: string;
  type: 'Training' | 'Certification';
  date?: string;
}

export interface Objective {
  id: string;
  text: string;
  dueDate?: string;
}

export interface OneToOneObjective {
  id: string;
  text: string;
  dueDate?: string;
}

// Daily Task Manager Types
export interface DailyTask {
  id: string;
  taskGroupId: string;
  text: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  recurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  rolledOver?: boolean;
}

export interface RecurringTask {
  id: string;
  text: string;
  pattern: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface WorkHours {
  id: string;
  date: string;
  hours: number;
  notes: string;
}

// App State
export interface TeamData {
  employees: Record<string, Employee>;
}

export interface TasksData {
  tasks: DailyTask[];
  recurringTasks: RecurringTask[];
  workHours: WorkHours[];
}
