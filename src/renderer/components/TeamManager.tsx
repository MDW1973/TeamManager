import React, { useState, useEffect } from 'react';
import { Employee, TeamData } from '../../types';
import './TeamManager.css';

export const TeamManager: React.FC<{ navigateToEmployeeId?: string | null }> = ({ navigateToEmployeeId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'list'>('hierarchy');
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [newTrainingName, setNewTrainingName] = useState('');
  const [newTrainingType, setNewTrainingType] = useState<'Training' | 'Certification'>('Training');
  const [newTrainingDate, setNewTrainingDate] = useState('');
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [newObjectiveDueDate, setNewObjectiveDueDate] = useState('');
  const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
  const [editingObjectiveText, setEditingObjectiveText] = useState('');
  const [editingObjectiveDueDate, setEditingObjectiveDueDate] = useState('');
  const [newOneToOneObjectiveText, setNewOneToOneObjectiveText] = useState('');
  const [newOneToOneObjectiveDueDate, setNewOneToOneObjectiveDueDate] = useState('');
  const [editingOneToOneObjectiveId, setEditingOneToOneObjectiveId] = useState<string | null>(null);
  const [editingOneToOneObjectiveText, setEditingOneToOneObjectiveText] = useState('');
  const [editingOneToOneObjectiveDueDate, setEditingOneToOneObjectiveDueDate] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    // If navigating from calendar to a specific employee
    if (navigateToEmployeeId && employees.length > 0) {
      const employee = employees.find(e => e.id === navigateToEmployeeId);
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [navigateToEmployeeId, employees]);

  useEffect(() => {
    // Auto-expand all managers on load
    if (employees.length > 0 && expandedManagers.size === 0) {
      const managersWithReports = new Set<string>();
      employees.forEach(emp => {
        const hasReports = employees.some(e => e.manager === emp.id);
        if (hasReports) {
          managersWithReports.add(emp.id);
        }
      });
      setExpandedManagers(managersWithReports);
    }
  }, [employees]);

  const getDirectReports = (managerId: string): Employee[] => {
    return employees.filter(e => e.manager === managerId);
  };

  const toggleManager = (managerId: string) => {
    const newExpanded = new Set(expandedManagers);
    if (newExpanded.has(managerId)) {
      newExpanded.delete(managerId);
    } else {
      newExpanded.add(managerId);
    }
    setExpandedManagers(newExpanded);
  };

  const renderHierarchyNode = (employee: Employee, level: number = 0): JSX.Element => {
    const directReports = getDirectReports(employee.id);
    const isExpanded = expandedManagers.has(employee.id);
    const hasReports = directReports.length > 0;
    const listVertically = employee.listReportsVertically;

    return (
      <div key={employee.id} className="tree-node">
        <div className="tree-node-wrapper">
          <div
            className={`tree-card grade-${employee.grade.toLowerCase().replace(/\s+/g, '')} ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
            onClick={() => setSelectedEmployee(employee)}
          >
            <div className="card-header">
              <div className="card-name">{employee.name}</div>
              {hasReports && (
                <button
                  className="expand-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleManager(employee.id);
                  }}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              )}
            </div>
            <div className="card-position">{employee.position}</div>
            <div className="card-grade">{employee.grade}</div>
            {hasReports && (
              <div className="card-reports">{directReports.length} report{directReports.length !== 1 ? 's' : ''}</div>
            )}
          </div>
        </div>

        {hasReports && isExpanded && (
          <div className={`tree-children ${listVertically ? 'vertical' : ''}`}>
            <div className="tree-connector" />
            <div className={`children-container ${listVertically ? 'vertical' : ''}`}>
              {directReports.map((report, index) => (
                <div key={report.id} className={`child-wrapper ${listVertically ? 'vertical' : ''}`}>
                  {renderHierarchyNode(report, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const loadEmployees = async () => {
    try {
      const data = await window.electronAPI.team.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAddEmployee = () => {
    setFormData({
      name: '',
      position: '',
      grade: '',
      department: '',
      manager: null,
      email: '',
      listReportsVertically: false,
      training: [],
      objectives: [],
      oneToOneObjectives: []
    });
    setShowModal(true);
  };

  const handleEditEmployee = () => {
    if (!selectedEmployee) return;
    setFormData(selectedEmployee);
    setShowModal(true);
  };

  const handleSaveEmployee = async () => {
    try {
      const employee: Employee = {
        id: formData.id || Date.now().toString(),
        name: formData.name || '',
        position: formData.position || '',
        grade: formData.grade || '',
        department: formData.department || '',
        manager: formData.manager || null,
        email: formData.email || '',
        listReportsVertically: formData.listReportsVertically || false,
        training: formData.training || [],
        objectives: formData.objectives || [],
        oneToOneObjectives: formData.oneToOneObjectives || []
      };

      if (formData.id) {
        await window.electronAPI.team.updateEmployee(formData.id, employee);
      } else {
        await window.electronAPI.team.addEmployee(employee);
      }

      setShowModal(false);
      loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await window.electronAPI.team.deleteEmployee(id);
        loadEmployees();
        setSelectedEmployee(null);
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.trim().split('\n');
        
        if (lines.length < 2) {
          alert('CSV file is empty');
          return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const typeIdx = headers.indexOf('type');
        const nameIdx = headers.indexOf('name');
        const positionIdx = headers.indexOf('position');
        const gradeIdx = headers.indexOf('grade');
        const departmentIdx = headers.indexOf('department');
        const managerIdx = headers.indexOf('manager');
        const emailIdx = headers.indexOf('email');
        const listVerticallyIdx = headers.indexOf('listvertically');

        const newEmployees: Employee[] = [];
        const managerMap: Record<string, string> = {};

        // Parse employee rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || !line.includes(',')) continue;

          const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''));
          
          // Only process EMPLOYEE rows
          const rowType = typeIdx !== -1 ? fields[typeIdx] : '';
          if (rowType === 'EMPLOYEE') {
            const name = nameIdx !== -1 ? fields[nameIdx] : '';
            if (!name) continue;

            const id = Date.now().toString() + Math.random();
            const listVertically = listVerticallyIdx !== -1 ? fields[listVerticallyIdx].toLowerCase() === 'yes' : false;
            
            const employee: Employee = {
              id,
              name,
              position: positionIdx !== -1 ? fields[positionIdx] : '',
              grade: gradeIdx !== -1 ? fields[gradeIdx] : '',
              department: departmentIdx !== -1 ? fields[departmentIdx] : '',
              manager: null,
              email: emailIdx !== -1 ? fields[emailIdx] : '',
              listReportsVertically: listVertically,
              training: [],
              objectives: [],
              oneToOneObjectives: []
            };

            const managerName = managerIdx !== -1 ? fields[managerIdx] : '';
            if (managerName) {
              managerMap[id] = managerName;
            }

            newEmployees.push(employee);
          }
        }

        // Link managers
        newEmployees.forEach(emp => {
          const managerName = managerMap[emp.id];
          if (managerName) {
            const manager = newEmployees.find(e => e.name === managerName);
            if (manager) {
              emp.manager = manager.id;
            }
          }
        });

        // Save all employees
        for (const emp of newEmployees) {
          await window.electronAPI.team.addEmployee(emp);
        }

        loadEmployees();
        alert(`Successfully imported ${newEmployees.length} employees!`);
        setShowImportModal(false);
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  const topLevelEmployees = employees.filter(e => !e.manager);

  const handleEmailEmployee = () => {
    if (!selectedEmployee || !selectedEmployee.email) {
      alert('No email address available');
      return;
    }

    const subject = `Task Update for ${selectedEmployee.name}`;
    const body = `Hi ${selectedEmployee.name},\n\nI wanted to reach out regarding your tasks.\n\nBest regards`;
    const mailtoLink = `mailto:${selectedEmployee.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
  };

  const handleAddTraining = async () => {
    if (!selectedEmployee || !newTrainingName.trim()) return;

    try {
      const newTraining = {
        id: Date.now().toString(),
        name: newTrainingName,
        type: newTrainingType,
        date: newTrainingDate
      };

      const updatedEmployee = {
        ...selectedEmployee,
        training: [...selectedEmployee.training, newTraining]
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      setNewTrainingName('');
      setNewTrainingType('Training');
      setNewTrainingDate('');
      loadEmployees();
    } catch (error) {
      console.error('Error adding training:', error);
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!selectedEmployee) return;

    try {
      const updatedTraining = selectedEmployee.training.filter(t => t.id !== trainingId);

      const updatedEmployee = {
        ...selectedEmployee,
        training: updatedTraining
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting training:', error);
    }
  };

  const handleAddObjective = async () => {
    if (!selectedEmployee || !newObjectiveText.trim()) return;

    try {
      const newObjective = {
        id: Date.now().toString(),
        text: newObjectiveText,
        dueDate: newObjectiveDueDate
      };

      const updatedEmployee = {
        ...selectedEmployee,
        objectives: [...selectedEmployee.objectives, newObjective]
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      setNewObjectiveText('');
      setNewObjectiveDueDate('');
      loadEmployees();
    } catch (error) {
      console.error('Error adding objective:', error);
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!selectedEmployee) return;

    try {
      const updatedObjectives = selectedEmployee.objectives.filter(o => o.id !== objectiveId);

      const updatedEmployee = {
        ...selectedEmployee,
        objectives: updatedObjectives
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting objective:', error);
    }
  };

  const handleEditObjective = (objective: any) => {
    setEditingObjectiveId(objective.id);
    setEditingObjectiveText(objective.text);
    setEditingObjectiveDueDate(objective.dueDate || '');
  };

  const handleSaveObjective = async () => {
    if (!selectedEmployee || !editingObjectiveId) return;

    try {
      const updatedObjectives = selectedEmployee.objectives.map(o =>
        o.id === editingObjectiveId
          ? { ...o, text: editingObjectiveText, dueDate: editingObjectiveDueDate }
          : o
      );

      const updatedEmployee = {
        ...selectedEmployee,
        objectives: updatedObjectives
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      setEditingObjectiveId(null);
      setEditingObjectiveText('');
      setEditingObjectiveDueDate('');
      loadEmployees();
    } catch (error) {
      console.error('Error saving objective:', error);
    }
  };

  const handleCancelEditObjective = () => {
    setEditingObjectiveId(null);
    setEditingObjectiveText('');
    setEditingObjectiveDueDate('');
  };

  const handleAddOneToOneObjective = async () => {
    if (!selectedEmployee || !newOneToOneObjectiveText.trim()) return;

    try {
      const newOneToOneObjective = {
        id: Date.now().toString(),
        text: newOneToOneObjectiveText,
        dueDate: newOneToOneObjectiveDueDate
      };

      const updatedEmployee = {
        ...selectedEmployee,
        oneToOneObjectives: [...(selectedEmployee.oneToOneObjectives || []), newOneToOneObjective]
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      setNewOneToOneObjectiveText('');
      setNewOneToOneObjectiveDueDate('');
      loadEmployees();
    } catch (error) {
      console.error('Error adding one to one objective:', error);
    }
  };

  const handleDeleteOneToOneObjective = async (objectiveId: string) => {
    if (!selectedEmployee) return;

    try {
      const updatedOneToOneObjectives = (selectedEmployee.oneToOneObjectives || []).filter(o => o.id !== objectiveId);

      const updatedEmployee = {
        ...selectedEmployee,
        oneToOneObjectives: updatedOneToOneObjectives
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting one to one objective:', error);
    }
  };

  const handleEditOneToOneObjective = (objective: any) => {
    setEditingOneToOneObjectiveId(objective.id);
    setEditingOneToOneObjectiveText(objective.text);
    setEditingOneToOneObjectiveDueDate(objective.dueDate || '');
  };

  const handleSaveOneToOneObjective = async () => {
    if (!selectedEmployee || !editingOneToOneObjectiveId) return;

    try {
      const updatedOneToOneObjectives = (selectedEmployee.oneToOneObjectives || []).map(o =>
        o.id === editingOneToOneObjectiveId
          ? { ...o, text: editingOneToOneObjectiveText, dueDate: editingOneToOneObjectiveDueDate }
          : o
      );

      const updatedEmployee = {
        ...selectedEmployee,
        oneToOneObjectives: updatedOneToOneObjectives
      };

      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
      setSelectedEmployee(updatedEmployee);
      setEditingOneToOneObjectiveId(null);
      setEditingOneToOneObjectiveText('');
      setEditingOneToOneObjectiveDueDate('');
      loadEmployees();
    } catch (error) {
      console.error('Error saving one to one objective:', error);
    }
  };

  const handleCancelEditOneToOneObjective = () => {
    setEditingOneToOneObjectiveId(null);
    setEditingOneToOneObjectiveText('');
    setEditingOneToOneObjectiveDueDate('');
  };

  return (
    <div className="team-manager">
      <header className="team-header">
        <h1>Team Manager</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            📥 Import CSV
          </button>
          <button className="btn btn-primary" onClick={handleAddEmployee}>
            + Add Employee
          </button>
        </div>
      </header>

      <div className="team-content">
        {!selectedEmployee ? (
          <div className="hierarchy-view full-screen">
            <h2>Organization Structure</h2>
            <div className="tree-view">
              {topLevelEmployees.map(emp => renderHierarchyNode(emp))}
            </div>
          </div>
        ) : (
          <div className="employee-detail full-screen">
            <div className="detail-header">
              <h2>{selectedEmployee.name}</h2>
              <div className="header-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleEditEmployee}
                  title="Edit employee"
                >
                  ✎
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                  title="Delete employee"
                >
                  🗑️
                </button>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedEmployee(null)}
                title="Close details"
              >
                ✕
              </button>
            </div>
            <div className="detail-scroll">
              {/* Employee Information Card - Horizontal */}
              <div className="employee-info-card">
                <div className="info-field">
                  <label>Position</label>
                  <span>{selectedEmployee.position}</span>
                </div>
                <div className="info-field">
                  <label>Grade</label>
                  <span className={`grade-badge grade-${selectedEmployee.grade.toLowerCase().replace(/\s+/g, '')}`}>
                    {selectedEmployee.grade}
                  </span>
                </div>
                <div className="info-field">
                  <label>Department</label>
                  <span>{selectedEmployee.department || '-'}</span>
                </div>
                <div className="info-field">
                  <label>Email</label>
                  <span>{selectedEmployee.email || '-'}</span>
                </div>
                <div className="info-field">
                  <label>Manager</label>
                  <select
                    value={selectedEmployee.manager || ''}
                    onChange={async (e) => {
                      const newManagerId = e.target.value || null;
                      const updated = { ...selectedEmployee, manager: newManagerId };
                      await window.electronAPI.team.updateEmployee(selectedEmployee.id, updated);
                      setSelectedEmployee(updated);
                      loadEmployees();
                    }}
                    className="manager-select"
                  >
                    <option value="">No Manager</option>
                    {employees
                      .filter(e => e.id !== selectedEmployee.id)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="info-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedEmployee.listReportsVertically}
                      onChange={async (e) => {
                        const updated = { ...selectedEmployee, listReportsVertically: e.target.checked };
                        await window.electronAPI.team.updateEmployee(selectedEmployee.id, updated);
                        setSelectedEmployee(updated);
                        loadEmployees();
                      }}
                    />
                    List reports vertically
                  </label>
                </div>
              </div>

              <div className="detail-columns">

                {/* Column 2: Training & Certifications */}
                <div className="detail-column">
                  <div className="section-header">
                    <h3>Training & Certifications</h3>
                    <button className="btn btn-small" onClick={() => document.getElementById('training-input')?.focus()}>
                      +
                    </button>
                  </div>
                  {selectedEmployee.training.length === 0 ? (
                    <p className="empty-message">No training records</p>
                  ) : (
                    <ul className="training-list">
                      {selectedEmployee.training.map(t => (
                        <li key={t.id}>
                          <div className="training-content">
                            <strong>{t.name}</strong>
                            <span className={`training-type ${t.type.toLowerCase()}`}>{t.type}</span>
                            {t.date && <span className="training-date">{t.type === 'Training' ? 'Course' : 'Exam Passed'}: {new Date(t.date).toLocaleDateString()}</span>}
                          </div>
                          <button
                            className="training-delete-btn"
                            onClick={() => handleDeleteTraining(t.id)}
                            title="Delete training"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="add-training-form">
                    <input
                      id="training-input"
                      type="text"
                      value={newTrainingName}
                      onChange={e => setNewTrainingName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddTraining()}
                      placeholder="Training name..."
                      className="training-input"
                    />
                    <select
                      value={newTrainingType}
                      onChange={e => setNewTrainingType(e.target.value as 'Training' | 'Certification')}
                      className="training-type-select"
                    >
                      <option value="Training">Training</option>
                      <option value="Certification">Certification</option>
                    </select>
                    <input
                      type="date"
                      value={newTrainingDate}
                      onChange={e => setNewTrainingDate(e.target.value)}
                      placeholder={newTrainingType === 'Training' ? 'Course date' : 'Exam passed date'}
                      className="training-input"
                      title={newTrainingType === 'Training' ? 'Course date' : 'Exam passed date'}
                    />
                    <button className="btn btn-small" onClick={handleAddTraining}>
                      Add
                    </button>
                  </div>
                </div>

                {/* Column 2: Appraisal Objectives */}
                <div className="detail-column">
                  <div className="section-header">
                    <h3>Appraisal Objectives</h3>
                    <button className="btn btn-small" onClick={() => document.getElementById('objective-input')?.focus()}>
                      +
                    </button>
                  </div>
                  {(selectedEmployee.objectives || []).length === 0 ? (
                    <p className="empty-message">No objectives set</p>
                  ) : (
                    <ul className="objectives-list">
                      {(selectedEmployee.objectives || []).map(o => (
                        <li key={o.id}>
                          {editingObjectiveId === o.id ? (
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editingObjectiveText}
                                onChange={e => setEditingObjectiveText(e.target.value)}
                                className="objective-input"
                              />
                              <input
                                type="date"
                                value={editingObjectiveDueDate}
                                onChange={e => setEditingObjectiveDueDate(e.target.value)}
                                className="objective-input"
                              />
                              <button className="btn btn-small" onClick={handleSaveObjective}>
                                Save
                              </button>
                              <button className="btn btn-small" onClick={handleCancelEditObjective}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="objective-content">
                                <input
                                  type="checkbox"
                                  checked={o.completed || false}
                                  onChange={async () => {
                                    const updatedObjectives = selectedEmployee.objectives.map(obj =>
                                      obj.id === o.id ? { ...obj, completed: !obj.completed } : obj
                                    );
                                    const updatedEmployee = { ...selectedEmployee, objectives: updatedObjectives };
                                    await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
                                    setSelectedEmployee(updatedEmployee);
                                    loadEmployees();
                                  }}
                                  className="objective-checkbox"
                                  title="Mark as complete"
                                />
                                <span className={`objective-text ${o.completed ? 'completed' : ''}`}>{o.text}</span>
                                {o.dueDate && <span className="objective-date">Due: {new Date(o.dueDate).toLocaleDateString()}</span>}
                              </div>
                              <div className="objective-actions">
                                <button
                                  className="objective-action-btn"
                                  onClick={() => handleEditObjective(o)}
                                  title="Edit objective"
                                >
                                  ✎
                                </button>
                                <button
                                  className="objective-action-btn"
                                  onClick={() => {
                                    const subject = `Objective: ${o.text}`;
                                    const dueDateText = o.dueDate ? `\nDue Date: ${new Date(o.dueDate).toLocaleDateString()}` : '';
                                    const body = `Hi ${selectedEmployee.name},\n\nRegarding your objective: ${o.text}${dueDateText}\n\nBest regards`;
                                    const mailtoLink = `mailto:${selectedEmployee.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                    window.location.href = mailtoLink;
                                  }}
                                  title="Email about objective"
                                >
                                  ✉️
                                </button>
                                <button
                                  className="objective-delete-btn"
                                  onClick={() => handleDeleteObjective(o.id)}
                                  title="Delete objective"
                                >
                                  ✕
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="add-objective-form">
                    <input
                      id="objective-input"
                      type="text"
                      value={newObjectiveText}
                      onChange={e => setNewObjectiveText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddObjective()}
                      placeholder="Add objective..."
                      className="objective-input"
                    />
                    <input
                      type="date"
                      value={newObjectiveDueDate}
                      onChange={e => setNewObjectiveDueDate(e.target.value)}
                      placeholder="Due date"
                      className="objective-input"
                      title="Due date"
                    />
                    <button className="btn btn-small" onClick={handleAddObjective}>
                      Add
                    </button>
                  </div>
                </div>

                {/* Column 3: One to One Objectives */}
                <div className="detail-column">
                  <div className="section-header">
                    <h3>One to One Objectives</h3>
                    <button className="btn btn-small" onClick={() => document.getElementById('one-to-one-objective-input')?.focus()}>
                      +
                    </button>
                  </div>
                  {(selectedEmployee.oneToOneObjectives || []).length === 0 ? (
                    <p className="empty-message">No objectives set</p>
                  ) : (
                    <ul className="objectives-list">
                      {(selectedEmployee.oneToOneObjectives || []).map(o => (
                        <li key={o.id}>
                          {editingOneToOneObjectiveId === o.id ? (
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editingOneToOneObjectiveText}
                                onChange={e => setEditingOneToOneObjectiveText(e.target.value)}
                                className="objective-input"
                              />
                              <input
                                type="date"
                                value={editingOneToOneObjectiveDueDate}
                                onChange={e => setEditingOneToOneObjectiveDueDate(e.target.value)}
                                className="objective-input"
                              />
                              <button className="btn btn-small" onClick={handleSaveOneToOneObjective}>
                                Save
                              </button>
                              <button className="btn btn-small" onClick={handleCancelEditOneToOneObjective}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="objective-content">
                                <input
                                  type="checkbox"
                                  checked={o.completed || false}
                                  onChange={async () => {
                                    const updatedOneToOneObjectives = (selectedEmployee.oneToOneObjectives || []).map(obj =>
                                      obj.id === o.id ? { ...obj, completed: !obj.completed } : obj
                                    );
                                    const updatedEmployee = { ...selectedEmployee, oneToOneObjectives: updatedOneToOneObjectives };
                                    await window.electronAPI.team.updateEmployee(selectedEmployee.id, updatedEmployee);
                                    setSelectedEmployee(updatedEmployee);
                                    loadEmployees();
                                  }}
                                  className="objective-checkbox"
                                  title="Mark as complete"
                                />
                                <span className={`objective-text ${o.completed ? 'completed' : ''}`}>{o.text}</span>
                                {o.dueDate && <span className="objective-date">Due: {new Date(o.dueDate).toLocaleDateString()}</span>}
                              </div>
                              <div className="objective-actions">
                                <button
                                  className="objective-action-btn"
                                  onClick={() => handleEditOneToOneObjective(o)}
                                  title="Edit objective"
                                >
                                  ✎
                                </button>
                                <button
                                  className="objective-action-btn"
                                  onClick={() => {
                                    const subject = `One to One Objective: ${o.text}`;
                                    const dueDateText = o.dueDate ? `\nDue Date: ${new Date(o.dueDate).toLocaleDateString()}` : '';
                                    const body = `Hi ${selectedEmployee.name},\n\nRegarding your one to one objective: ${o.text}${dueDateText}\n\nBest regards`;
                                    const mailtoLink = `mailto:${selectedEmployee.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                    window.location.href = mailtoLink;
                                  }}
                                  title="Email about objective"
                                >
                                  ✉️
                                </button>
                                <button
                                  className="objective-delete-btn"
                                  onClick={() => handleDeleteOneToOneObjective(o.id)}
                                  title="Delete objective"
                                >
                                  ✕
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="add-objective-form">
                    <input
                      id="one-to-one-objective-input"
                      type="text"
                      value={newOneToOneObjectiveText}
                      onChange={e => setNewOneToOneObjectiveText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddOneToOneObjective()}
                      placeholder="Add objective..."
                      className="objective-input"
                    />
                    <input
                      type="date"
                      value={newOneToOneObjectiveDueDate}
                      onChange={e => setNewOneToOneObjectiveDueDate(e.target.value)}
                      placeholder="Due date"
                      className="objective-input"
                      title="Due date"
                    />
                    <button className="btn btn-small" onClick={handleAddOneToOneObjective}>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="detail-column notes-section">
                <div className="section-header">
                  <h3>Notes & Comments</h3>
                </div>
                <textarea
                  value={selectedEmployee.notes || ''}
                  onChange={async (e) => {
                    const updated = { ...selectedEmployee, notes: e.target.value };
                    setSelectedEmployee(updated);
                  }}
                  onBlur={async () => {
                    await window.electronAPI.team.updateEmployee(selectedEmployee.id, selectedEmployee);
                    loadEmployees();
                  }}
                  placeholder="Add notes or comments about this employee..."
                  className="notes-textarea"
                />
              </div>

            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Employee</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveEmployee();
              }}
            >
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Position *</label>
                <input
                  type="text"
                  value={formData.position || ''}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Grade *</label>
                <select
                  value={formData.grade || ''}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="PO6">PO6</option>
                  <option value="PO4">PO4</option>
                  <option value="PO2">PO2</option>
                  <option value="SO1">SO1</option>
                  <option value="A3">A3</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Student">Student</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Import Team Data from CSV</h2>
            <p>Select your team_data.csv file to import employees.</p>
            <div style={{ marginTop: '20px' }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                style={{ display: 'block', marginBottom: '20px' }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
