import React, { useState, useEffect } from 'react';
import { DailyTask, RecurringTask } from '../../types';
import './DailyTasks.css';

export const DailyTasks: React.FC<{ navigateToDate?: string | null }> = ({ navigateToDate }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskDueDate, setEditingTaskDueDate] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newRecurringText, setNewRecurringText] = useState('');
  const [newRecurringPattern, setNewRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newRecurringPriority, setNewRecurringPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const [editingRecurringText, setEditingRecurringText] = useState('');
  const [editingRecurringPattern, setEditingRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editingRecurringPriority, setEditingRecurringPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurringTasksCreated, setRecurringTasksCreated] = useState(false);

  useEffect(() => {
    // If navigating from calendar, update the selected date
    if (navigateToDate) {
      setSelectedDate(navigateToDate);
    }
  }, [navigateToDate]);

  useEffect(() => {
    const loadDataForDate = async () => {
      await loadRecurringTasks();
      await handleRollover();
      setRecurringTasksCreated(false);
      // Load tasks after rollover completes
      await loadTasks();
    };
    
    loadDataForDate();
  }, [selectedDate]);

  useEffect(() => {
    if (!recurringTasksCreated && recurringTasks.length > 0) {
      createRecurringTaskInstances();
      setRecurringTasksCreated(true);
    }
  }, [recurringTasks, selectedDate, recurringTasksCreated]);

  const loadTasks = async () => {
    try {
      console.log(`Loading tasks for ${selectedDate}`);
      const tasksForDate = await window.electronAPI.tasks.getTasksForDate(selectedDate);
      console.log(`Loaded ${tasksForDate.length} tasks for ${selectedDate}`);
      tasksForDate.forEach(t => console.log(`  - ${t.text} (completed: ${t.completed})`));
      setTasks(tasksForDate);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadRecurringTasks = async () => {
    try {
      const recurring = await window.electronAPI.tasks.getAllRecurringTasks();
      setRecurringTasks(recurring);
    } catch (error) {
      console.error('Error loading recurring tasks:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      const taskGroupId = Date.now().toString() + Math.random();
      const task: DailyTask = {
        id: Date.now().toString() + Math.random(),
        taskGroupId,
        text: newTaskText,
        date: selectedDate,
        dueDate: newTaskDueDate || undefined,
        completed: false,
        priority: newTaskPriority
      };

      await window.electronAPI.tasks.addTask(task);
      setNewTaskText('');
      setNewTaskDueDate('');
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (task: DailyTask) => {
    try {
      const newCompletedState = !task.completed;
      
      // Update the current task status
      await window.electronAPI.tasks.updateTask(task.id, {
        completed: newCompletedState
      });

      // If marking as complete, delete all FUTURE instances of this task group
      if (newCompletedState) {
        console.log(`Marking task complete: ${task.text}`);
        await deleteFutureTasksByGroupId(task.taskGroupId);
        // Wait to ensure deletion is persisted
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // If marking as incomplete, wait to ensure the state is persisted
        // so rollover can pick it up when navigating to future days
        console.log(`Marking task incomplete: ${task.text}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Reload tasks to update the UI
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await window.electronAPI.tasks.deleteTask(id);
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: DailyTask) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
    setEditingTaskDueDate(task.dueDate || '');
    setEditingTaskPriority(task.priority);
  };

  const handleSaveEditTask = async () => {
    if (!editingTaskId || !editingTaskText.trim()) return;

    try {
      const currentTask = tasks.find(t => t.id === editingTaskId);
      if (!currentTask) return;

      const oldText = currentTask.text;
      const oldPriority = currentTask.priority;

      // Update the current task (preserves taskGroupId)
      await window.electronAPI.tasks.updateTask(editingTaskId, {
        text: editingTaskText,
        dueDate: editingTaskDueDate || undefined,
        priority: editingTaskPriority
      });

      // Update all future instances of this task group with the new text/priority
      if (oldText !== editingTaskText || oldPriority !== editingTaskPriority) {
        await updateFutureTasksByGroupId(currentTask.taskGroupId, editingTaskText, editingTaskPriority);
      }

      // If this is a recurring task, update all future instances
      if (currentTask?.recurring) {
        await updateFutureRecurringTasks(editingTaskId, editingTaskText, editingTaskPriority);
      }

      setEditingTaskId(null);
      setEditingTaskText('');
      setEditingTaskDueDate('');
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
    setEditingTaskDueDate('');
  };

  const updateFutureRecurringTasks = async (taskId: string, newText: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      const currentTask = allTasks.find(t => t.id === taskId);
      
      if (!currentTask) return;

      // Find all tasks with the same text that occur after this date
      const futureTasks = allTasks.filter(t => 
        t.text === currentTask.text && 
        t.date > selectedDate &&
        t.priority === currentTask.priority
      );

      // Update all future instances
      for (const task of futureTasks) {
        await window.electronAPI.tasks.updateTask(task.id, {
          text: newText,
          priority: newPriority
        });
      }
    } catch (error) {
      console.error('Error updating future recurring tasks:', error);
    }
  };

  const updateFutureTasksByGroupId = async (taskGroupId: string, newText: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      
      // Find all tasks with the same group ID that occur after this date
      const futureTasksToUpdate = allTasks.filter(t => 
        t.taskGroupId === taskGroupId && 
        t.date > selectedDate
      );

      // Update all future instances with new text and priority
      for (const task of futureTasksToUpdate) {
        await window.electronAPI.tasks.updateTask(task.id, {
          text: newText,
          priority: newPriority
        });
      }
    } catch (error) {
      console.error('Error updating future task instances:', error);
    }
  };

  const deleteFutureTasksByGroupId = async (taskGroupId: string) => {
    try {
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      
      // Find all tasks with the same group ID that occur after this date
      const futureTasksToDelete = allTasks.filter(t => 
        t.taskGroupId === taskGroupId && 
        t.date > selectedDate
      );

      console.log(`Deleting ${futureTasksToDelete.length} future tasks with groupId ${taskGroupId} after ${selectedDate}`);

      // Delete all future instances
      for (const task of futureTasksToDelete) {
        console.log(`  Deleting task: ${task.text} on ${task.date}`);
        await window.electronAPI.tasks.deleteTask(task.id);
      }
      
      console.log(`Finished deleting future tasks`);
    } catch (error) {
      console.error('Error deleting future task instances:', error);
    }
  };

  const handleRollover = async () => {
    try {
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      
      console.log(`Rollover check for ${selectedDate}. Total tasks in DB: ${allTasks.length}`);
      
      // Get all unique task groups from previous days
      const tasksByGroup = new Map<string, DailyTask>();
      
      // Find the most recent version of each task group from previous days
      allTasks
        .filter(t => t.date < selectedDate && !t.recurring)
        .sort((a, b) => b.date.localeCompare(a.date)) // Sort by date descending (most recent first)
        .forEach(task => {
          // Only keep the most recent version of each task group
          if (!tasksByGroup.has(task.taskGroupId)) {
            tasksByGroup.set(task.taskGroupId, task);
          }
        });
      
      console.log(`Found ${tasksByGroup.size} unique task groups from previous days`);
      
      // Filter to only incomplete tasks that should roll over
      const incompleteTaskGroups = Array.from(tasksByGroup.values()).filter(t => !t.completed);
      console.log(`${incompleteTaskGroups.length} are incomplete and should roll over`);
      incompleteTaskGroups.forEach(t => console.log(`  - ${t.text} from ${t.date} (groupId: ${t.taskGroupId})`));

      // Check what already exists for today
      let existingTasks = await window.electronAPI.tasks.getTasksForDate(selectedDate);
      let existingGroupIds = new Set(existingTasks.map(t => t.taskGroupId));

      // Add incomplete tasks to today if they don't already exist
      for (const task of incompleteTaskGroups) {
        if (!existingGroupIds.has(task.taskGroupId)) {
          // Check if task has a due date matching today - if so, make it high priority
          let priority = task.priority;
          if (task.dueDate === selectedDate) {
            priority = 'high';
            console.log(`  Task ${task.text} is due today - promoting to HIGH priority`);
          }

          const newTask: DailyTask = {
            id: Date.now().toString() + Math.random(),
            taskGroupId: task.taskGroupId,
            text: task.text,
            date: selectedDate,
            dueDate: task.dueDate,
            completed: false,
            priority: priority,
            recurring: task.recurring,
            recurringPattern: task.recurringPattern
          };
          console.log(`  Rolling over: ${newTask.text}`);
          await window.electronAPI.tasks.addTask(newTask);
          await new Promise(resolve => setTimeout(resolve, 10));
          // Refresh existing tasks after adding a new one
          existingTasks = await window.electronAPI.tasks.getTasksForDate(selectedDate);
          existingGroupIds = new Set(existingTasks.map(t => t.taskGroupId));
        } else {
          console.log(`  Task ${task.text} already exists for ${selectedDate}, skipping`);
        }
      }

      // Reload existing tasks one more time to get the latest state
      existingTasks = await window.electronAPI.tasks.getTasksForDate(selectedDate);
      
      // Check existing tasks for today - if any have due date matching today, promote to high priority
      for (const existingTask of existingTasks) {
        if (existingTask.dueDate === selectedDate && existingTask.priority !== 'high' && !existingTask.completed) {
          console.log(`  Existing task ${existingTask.text} is due today - promoting to HIGH priority`);
          await window.electronAPI.tasks.updateTask(existingTask.id, {
            priority: 'high'
          });
        }
      }
    } catch (error) {
      console.error('Error during rollover:', error);
    }
  };

  const handlePreviousDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d - 1);
    setSelectedDate(date.toLocaleDateString('en-CA')); // YYYY-MM-DD in local time
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + 1);
    setSelectedDate(date.toLocaleDateString('en-CA'));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toLocaleDateString('en-CA'));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const [selY, selM, selD] = selectedDate.split('-').map(Number);
  const displayDate = new Date(selY, selM - 1, selD).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDeleteAllTasks = async () => {
    if (!window.confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
      return;
    }
    try {
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      for (const task of allTasks) {
        await window.electronAPI.tasks.deleteTask(task.id);
      }
      loadTasks();
    } catch (error) {
      console.error('Error deleting all tasks:', error);
    }
  };

  const handleAddRecurringTask = async () => {
    if (!newRecurringText.trim()) return;

    try {
      const task: RecurringTask = {
        id: Date.now().toString() + Math.random(),
        text: newRecurringText,
        pattern: newRecurringPattern,
        priority: newRecurringPriority
      };

      await window.electronAPI.tasks.addRecurringTask(task);
      setNewRecurringText('');
      setNewRecurringPattern('daily');
      setNewRecurringPriority('medium');
      loadRecurringTasks();
    } catch (error) {
      console.error('Error adding recurring task:', error);
    }
  };

  const handleEditRecurringTask = (task: RecurringTask) => {
    setEditingRecurringId(task.id);
    setEditingRecurringText(task.text);
    setEditingRecurringPattern(task.pattern);
    setEditingRecurringPriority(task.priority);
  };

  const handleSaveRecurringTask = async () => {
    if (!editingRecurringId || !editingRecurringText.trim()) return;

    try {
      await window.electronAPI.tasks.updateRecurringTask(editingRecurringId, {
        text: editingRecurringText,
        pattern: editingRecurringPattern,
        priority: editingRecurringPriority
      });

      setEditingRecurringId(null);
      setEditingRecurringText('');
      loadRecurringTasks();
    } catch (error) {
      console.error('Error saving recurring task:', error);
    }
  };

  const handleCancelEditRecurring = () => {
    setEditingRecurringId(null);
    setEditingRecurringText('');
  };

  const handleDeleteRecurringTask = async (id: string) => {
    try {
      await window.electronAPI.tasks.deleteRecurringTask(id);
      loadRecurringTasks();
    } catch (error) {
      console.error('Error deleting recurring task:', error);
    }
  };

  const createRecurringTaskInstances = async () => {
    try {
      const existingTasks = await window.electronAPI.tasks.getTasksForDate(selectedDate);
      
      // Check which recurring tasks already exist for today by taskGroupId
      const existingGroupIds = new Set(
        existingTasks
          .filter(t => t.recurring)
          .map(t => t.taskGroupId)
      );

      // Create instances for recurring tasks that don't exist yet
      for (const recurringTask of recurringTasks) {
        const shouldCreate = shouldCreateRecurringTaskForDate(recurringTask);

        if (shouldCreate && !existingGroupIds.has(recurringTask.id)) {
          const newTask: DailyTask = {
            id: Date.now().toString() + Math.random(),
            taskGroupId: recurringTask.id,
            text: recurringTask.text,
            date: selectedDate,
            completed: false,
            priority: recurringTask.priority,
            recurring: true,
            recurringPattern: recurringTask.pattern
          };
          await window.electronAPI.tasks.addTask(newTask);
        }
      }

      loadTasks();
    } catch (error) {
      console.error('Error creating recurring task instances:', error);
    }
  };

  const shouldCreateRecurringTaskForDate = (recurringTask: RecurringTask): boolean => {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const todayDayOfMonth = today.getDate();

    switch (recurringTask.pattern) {
      case 'daily':
        return true;
      case 'weekly':
        // Create on the same day of week as today
        return dayOfWeek === todayDayOfWeek;
      case 'monthly':
        // Create on the same day of month as today
        return dayOfMonth === todayDayOfMonth;
      default:
        return false;
    }
  };

  const isOverdue = (task: DailyTask): boolean => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date().toLocaleDateString('en-CA');
    return task.dueDate < today;
  };

  const getEffectivePriority = (task: DailyTask): 'low' | 'medium' | 'high' => {
    // If task is overdue, treat it as high priority
    if (isOverdue(task)) {
      return 'high';
    }
    return task.priority;
  };

  const getSortedTasks = (): DailyTask[] => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    // Separate incomplete and completed tasks
    const incompleteTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    // Sort incomplete tasks: recurring first, then by priority (considering overdue)
    incompleteTasks.sort((a, b) => {
      // Recurring tasks come first
      if (a.recurring !== b.recurring) {
        return a.recurring ? -1 : 1;
      }
      // Then sort by effective priority (overdue tasks are high priority)
      return priorityOrder[getEffectivePriority(a)] - priorityOrder[getEffectivePriority(b)];
    });

    // Return incomplete tasks first, then completed tasks at the bottom
    return [...incompleteTasks, ...completedTasks];
  };

  return (
    <div className="daily-tasks">
      <header className="tasks-header">
        <h1>Daily Tasks</h1>
        <div className="header-buttons">
          <button className="btn btn-secondary" onClick={() => setShowRecurringModal(true)}>
            ⚙️ Recurring Tasks
          </button>
          <button className="btn btn-danger" onClick={handleDeleteAllTasks} title="Delete all tasks for testing">
            🗑️ Delete All
          </button>
        </div>
      </header>

      <div className="tasks-content">
        <div className="date-navigation">
          <button className="btn btn-secondary" onClick={handlePreviousDay}>
            ← Previous
          </button>
          <div className="date-display">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="date-input"
            />
            <span className="date-text">{displayDate}</span>
          </div>
          <button className="btn btn-secondary" onClick={handleNextDay}>
            Next →
          </button>
          <button className="btn btn-secondary" onClick={handleToday}>
            Today
          </button>
        </div>

        <div className="add-task-section">
          <div className="add-task-form">
            <input
              type="text"
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleAddTask();
                }
              }}
              placeholder="Enter a new task..."
              className="task-input-inline"
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={e => setNewTaskDueDate(e.target.value)}
              className="task-input-inline"
              title="Due date (optional)"
            />
            <select
              value={newTaskPriority}
              onChange={e =>
                setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')
              }
              className="priority-select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button className="btn btn-primary" onClick={handleAddTask}>
              Add Task
            </button>
          </div>
        </div>

        <div className="tasks-main">
          <div className="tasks-list">
            <div className="tasks-header-info">
              <h2>Tasks</h2>
              <span className="task-count">
                {completedCount} of {tasks.length} completed
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks for this day</p>
                <p className="empty-hint">Add a task below to get started</p>
              </div>
            ) : (
              <div className="task-items">
                {getSortedTasks().map(task => (
                  <div key={task.id}>
                    {editingTaskId === task.id ? (
                      <div className="task-item editing">
                        <textarea
                          value={editingTaskText}
                          onChange={e => setEditingTaskText(e.target.value)}
                          className="task-edit-input"
                          placeholder="Edit task..."
                        />
                        <input
                          type="date"
                          value={editingTaskDueDate}
                          onChange={e => setEditingTaskDueDate(e.target.value)}
                          className="task-edit-input"
                          title="Due date (optional)"
                        />
                        <select
                          value={editingTaskPriority}
                          onChange={e =>
                            setEditingTaskPriority(e.target.value as 'low' | 'medium' | 'high')
                          }
                          className="priority-select"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                        <div className="edit-actions">
                          <button
                            className="btn btn-primary"
                            onClick={handleSaveEditTask}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={handleCancelEditTask}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`task-item priority-${getEffectivePriority(task)} ${
                          task.completed ? 'completed' : ''
                        } ${isOverdue(task) ? 'overdue' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task)}
                          className="task-checkbox"
                        />
                        <div className="task-content">
                          <span className="task-text">{task.text}</span>
                          {task.dueDate && (
                            <span className={`task-due-date ${isOverdue(task) ? 'overdue-date' : ''}`}>
                              Due: {(() => { const [dy, dm, dd] = task.dueDate.split('-').map(Number); return new Date(dy, dm - 1, dd).toLocaleDateString(); })()}
                              {isOverdue(task) && ' ⚠️ OVERDUE'}
                            </span>
                          )}
                          <div className="task-badges">
                            {task.recurring && (
                              <span className="task-badge recurring-badge">
                                🔄 Recurring
                              </span>
                            )}
                            <span className={`task-priority priority-${getEffectivePriority(task)}`}>
                              {isOverdue(task) ? 'overdue' : task.priority}
                            </span>
                          </div>
                        </div>
                        <button
                          className="task-edit"
                          onClick={() => handleEditTask(task)}
                          title="Edit task"
                        >
                          ✎
                        </button>
                        <button
                          className="task-delete"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showRecurringModal && (
        <div className="modal-overlay" onClick={() => setShowRecurringModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recurring Tasks</h2>
              <button
                className="modal-close"
                onClick={() => setShowRecurringModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="recurring-list-section">
              <h3>Active Recurring Tasks ({recurringTasks.length})</h3>
              {recurringTasks.length === 0 ? (
                <p className="empty-message">No recurring tasks set up</p>
              ) : (
                <div className="recurring-items">
                  {recurringTasks.map(task => (
                    <div key={task.id}>
                      {editingRecurringId === task.id ? (
                        <div className="recurring-item editing">
                          <textarea
                            value={editingRecurringText}
                            onChange={e => setEditingRecurringText(e.target.value)}
                            className="task-edit-input"
                            placeholder="Edit recurring task..."
                          />
                          <select
                            value={editingRecurringPattern}
                            onChange={e =>
                              setEditingRecurringPattern(e.target.value as 'daily' | 'weekly' | 'monthly')
                            }
                            className="priority-select"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <select
                            value={editingRecurringPriority}
                            onChange={e =>
                              setEditingRecurringPriority(e.target.value as 'low' | 'medium' | 'high')
                            }
                            className="priority-select"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                          <div className="edit-actions">
                            <button
                              className="btn btn-primary"
                              onClick={handleSaveRecurringTask}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={handleCancelEditRecurring}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="recurring-item">
                          <div className="recurring-content">
                            <span className="recurring-text">{task.text}</span>
                            <span className="recurring-pattern">{task.pattern}</span>
                            <span className={`task-priority priority-${task.priority}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="recurring-actions">
                            <button
                              className="task-edit"
                              onClick={() => handleEditRecurringTask(task)}
                              title="Edit recurring task"
                            >
                              ✎
                            </button>
                            <button
                              className="task-delete"
                              onClick={() => handleDeleteRecurringTask(task.id)}
                              title="Delete recurring task"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="add-recurring-section">
              <h3>Add New Recurring Task</h3>
              <div className="add-recurring-form">
                <textarea
                  value={newRecurringText}
                  onChange={e => setNewRecurringText(e.target.value)}
                  placeholder="Enter recurring task..."
                  className="task-input"
                />
                <div className="form-controls">
                  <select
                    value={newRecurringPattern}
                    onChange={e =>
                      setNewRecurringPattern(e.target.value as 'daily' | 'weekly' | 'monthly')
                    }
                    className="priority-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <select
                    value={newRecurringPriority}
                    onChange={e =>
                      setNewRecurringPriority(e.target.value as 'low' | 'medium' | 'high')
                    }
                    className="priority-select"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <button className="btn btn-primary" onClick={handleAddRecurringTask}>
                    Add Recurring
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
