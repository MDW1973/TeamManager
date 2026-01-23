import React, { useState, useEffect } from 'react';
import { DailyTask, RecurringTask } from '../../types';
import './DailyTasks.css';

export const DailyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
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
    loadRecurringTasks();
    handleRollover();
    setRecurringTasksCreated(false);
  }, [selectedDate]);

  useEffect(() => {
    if (!recurringTasksCreated && recurringTasks.length > 0) {
      createRecurringTaskInstances();
      setRecurringTasksCreated(true);
    }
  }, [recurringTasks, selectedDate, recurringTasksCreated]);

  const loadTasks = async () => {
    try {
      const tasksForDate = await window.electronAPI.tasks.getTasksForDate(selectedDate);
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
        completed: false,
        priority: newTaskPriority
      };

      await window.electronAPI.tasks.addTask(task);
      setNewTaskText('');
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (task: DailyTask) => {
    try {
      const newCompletedState = !task.completed;
      
      await window.electronAPI.tasks.updateTask(task.id, {
        completed: newCompletedState
      });

      // If marking as complete, delete all future instances of this task group
      if (newCompletedState) {
        await deleteFutureTasksByGroupId(task.taskGroupId);
      }

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
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
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

      // Delete all future instances
      for (const task of futureTasksToDelete) {
        await window.electronAPI.tasks.deleteTask(task.id);
      }
    } catch (error) {
      console.error('Error deleting future task instances:', error);
    }
  };

  const handleRollover = async () => {
    try {
      // Get all tasks to find incomplete ones from any previous day
      const allTasks = await window.electronAPI.tasks.getAllTasks();
      
      // Find all incomplete tasks from previous days (not rolled over yet)
      // Exclude recurring tasks - they get created fresh each day
      const incompleteTasks = allTasks.filter(t => 
        !t.completed && 
        !t.rolledOver && 
        !t.recurring &&
        t.date < selectedDate
      );

      // Check if any incomplete tasks already exist for today
      const existingTasks = await window.electronAPI.tasks.getTasksForDate(selectedDate);
      
      // Create a set of existing task group IDs to avoid duplicates
      const existingGroupIds = new Set(existingTasks.map(t => t.taskGroupId));

      // Add incomplete tasks to today if they don't already exist
      for (const task of incompleteTasks) {
        if (!existingGroupIds.has(task.taskGroupId)) {
          const newTask: DailyTask = {
            id: Date.now().toString() + Math.random(),
            taskGroupId: task.taskGroupId,
            text: task.text,
            date: selectedDate,
            completed: false,
            priority: task.priority,
            recurring: task.recurring,
            recurringPattern: task.recurringPattern,
            rolledOver: true
          };
          await window.electronAPI.tasks.addTask(newTask);
        }

        // Mark the original task as rolled over
        await window.electronAPI.tasks.updateTask(task.id, {
          rolledOver: true
        });
      }
    } catch (error) {
      console.error('Error during rollover:', error);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', {
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

  const getSortedTasks = (): DailyTask[] => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    // Separate incomplete and completed tasks
    const incompleteTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    // Sort incomplete tasks: recurring first, then by priority
    incompleteTasks.sort((a, b) => {
      // Recurring tasks come first
      if (a.recurring !== b.recurring) {
        return a.recurring ? -1 : 1;
      }
      // Then sort by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority];
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
                        className={`task-item priority-${task.priority} ${
                          task.completed ? 'completed' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task)}
                          className="task-checkbox"
                        />
                        <div className="task-content">
                          <span className="task-text">{task.text}</span>
                          <div className="task-badges">
                            {task.recurring && (
                              <span className="task-badge recurring-badge">
                                🔄 Recurring
                              </span>
                            )}
                            <span className={`task-priority priority-${task.priority}`}>
                              {task.priority}
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
