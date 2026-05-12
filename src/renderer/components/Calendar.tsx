import React, { useState, useEffect } from 'react';
import { DailyTask, Objective, OneToOneObjective } from '../../types';
import './Calendar.css';

interface ObjectiveTask {
  id: string;
  text: string;
  dueDate: string;
  completed?: boolean;
  employeeName: string;
  type: 'objective' | 'oneToOne';
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [objectiveTasks, setObjectiveTasks] = useState<ObjectiveTask[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      const allEmployees = await window.electronAPI.team.getAllEmployees();
      setTasks(allTasks);
      setEmployees(allEmployees);

      // Extract objective tasks from employees, deduplicating by ID
      const objectiveMap = new Map<string, ObjectiveTask>();
      allEmployees.forEach(emp => {
        // Appraisal Objectives
        if (emp.objectives && Array.isArray(emp.objectives)) {
          emp.objectives.forEach((obj: Objective) => {
            if (obj.dueDate && !objectiveMap.has(obj.id)) {
              objectiveMap.set(obj.id, {
                id: obj.id,
                text: obj.text,
                dueDate: obj.dueDate,
                completed: obj.completed,
                employeeName: emp.name,
                type: 'objective'
              });
            }
          });
        }
        // One-to-One Objectives
        if (emp.oneToOneObjectives && Array.isArray(emp.oneToOneObjectives)) {
          emp.oneToOneObjectives.forEach((obj: OneToOneObjective) => {
            if (obj.dueDate && !objectiveMap.has(obj.id)) {
              objectiveMap.set(obj.id, {
                id: obj.id,
                text: obj.text,
                dueDate: obj.dueDate,
                completed: obj.completed,
                employeeName: emp.name,
                type: 'oneToOne'
              });
            }
          });
        }
      });
      setObjectiveTasks(Array.from(objectiveMap.values()));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getMonday = (date: Date): Date => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  };

  const getWeekDates = (date: Date): Date[] => {
    const monday = getMonday(date);
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const getTasksForDate = (dateStr: string) => {
    // Only show tasks by their date field, not by dueDate
    let filtered = tasks.filter(t => t.date === dateStr);
    
    if (filterEmployee !== 'all') {
      filtered = filtered.filter(t => t.assignedTo === filterEmployee);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    
    return filtered;
  };

  const getTasksForDateWithDueDate = (dateStr: string) => {
    // Don't show tasks by dueDate - only show by date field
    return [];
  };

  const getObjectivesForDate = (dateStr: string) => {
    let filtered = objectiveTasks.filter(t => t.dueDate === dateStr);
    
    if (filterEmployee !== 'all') {
      filtered = filtered.filter(t => t.employeeName === employees.find(e => e.id === filterEmployee)?.name);
    }
    
    return filtered;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEmployeeInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleTaskClick = (e: React.MouseEvent, item: any, dateStr: string) => {
    e.stopPropagation();
    const isObjective = 'employeeName' in item;
    
    if (isObjective) {
      // For objectives, find the employee and dispatch event to open their profile
      const objectiveItem = item as ObjectiveTask;
      const employee = employees.find(e => e.name === objectiveItem.employeeName);
      if (employee) {
        const event = new CustomEvent('navigateToEmployee', { detail: { employeeId: employee.id } });
        window.dispatchEvent(event);
      }
    } else {
      // For daily tasks, dispatch event to navigate to that date
      const event = new CustomEvent('navigateToDailyTasks', { detail: { date: dateStr } });
      window.dispatchEvent(event);
    }
  };

  const weekDates = getWeekDates(currentDate);
  const weekStart = weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todayLocal = new Date();
  const today = todayLocal.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  return (
    <div className="calendar">
      <header className="calendar-header">
        <h1>Work Week Calendar</h1>
        <div className="calendar-controls">
          <button className="btn btn-secondary" onClick={handlePreviousWeek}>
            ← Previous Week
          </button>
          <h2 className="week-range">{weekStart} - {weekEnd}</h2>
          <button className="btn btn-secondary" onClick={handleNextWeek}>
            Next Week →
          </button>
          <button className="btn btn-secondary" onClick={handleToday}>
            Today
          </button>
        </div>
      </header>

      <div className="calendar-filters">
        <select
          value={filterEmployee}
          onChange={e => setFilterEmployee(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Employees</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color task-type-daily"></span>
          <span className="legend-label">Daily Tasks</span>
        </div>
        <div className="legend-item">
          <span className="legend-color task-type-appraisal"></span>
          <span className="legend-label">Appraisal Objectives</span>
        </div>
        <div className="legend-item">
          <span className="legend-color task-type-onetoone"></span>
          <span className="legend-label">1:1 Objectives</span>
        </div>
      </div>

      <div className="calendar-week-grid">
        {/* Day headers and content */}
        {weekDates.map((date, idx) => {
          const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();
          const dayTasks = getTasksForDate(dateStr);
          const dueTasks = getTasksForDateWithDueDate(dateStr);
          const objectives = getObjectivesForDate(dateStr);
          
          // Deduplicate all items by ID
          const itemIds = new Set<string>();
          const allItems: any[] = [];
          
          [...dayTasks, ...dueTasks, ...objectives].forEach(item => {
            if (!itemIds.has(item.id)) {
              itemIds.add(item.id);
              allItems.push(item);
            }
          });

          // Sort items: recurring first, then by priority (high, med, low), then objectives (appraisal, 1:1)
          allItems.sort((a, b) => {
            const isObjectiveA = 'employeeName' in a;
            const isObjectiveB = 'employeeName' in b;
            
            // Recurring tasks first
            if (a.recurring && !b.recurring) return -1;
            if (!a.recurring && b.recurring) return 1;
            
            // Then daily tasks by priority
            if (!isObjectiveA && !isObjectiveB) {
              const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
              const priorityA = priorityOrder[a.priority] ?? 3;
              const priorityB = priorityOrder[b.priority] ?? 3;
              return priorityA - priorityB;
            }
            
            // Daily tasks before objectives
            if (!isObjectiveA && isObjectiveB) return -1;
            if (isObjectiveA && !isObjectiveB) return 1;
            
            // Objectives: appraisal before 1:1
            if (isObjectiveA && isObjectiveB) {
              if (a.type === 'objective' && b.type === 'oneToOne') return -1;
              if (a.type === 'oneToOne' && b.type === 'objective') return 1;
            }
            
            return 0;
          });
          
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className={`calendar-day-column ${isToday ? 'today' : ''}`}
            >
              <div className="day-header">
                <div className="day-name">{dayName}</div>
                <div className="day-number">{dayNum}</div>
              </div>
              <div className="day-content">
                <div className="day-tasks">
                  {allItems.map((item, idx) => {
                    const isObjective = 'employeeName' in item;
                    const objectiveItem = item as ObjectiveTask;
                    const priority = isObjective ? 'medium' : item.priority;
                    const objectiveType = isObjective ? objectiveItem.type : null;
                    const initials = isObjective ? getEmployeeInitials(objectiveItem.employeeName) : '';
                    
                    return (
                      <div
                        key={idx}
                        className={`task-item-mini ${isObjective ? `objective objective-${objectiveType}` : ''} priority-${priority} ${item.completed ? 'completed' : ''}`}
                        title={item.text}
                        onClick={(e) => handleTaskClick(e, item, dateStr)}
                      >
                        <span className="task-dot" />
                        <span className="task-text-mini">{item.text}</span>
                        {isObjective && <span className="task-initials">{initials}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
