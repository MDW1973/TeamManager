// Data Management
class TeamManager {
    constructor() {
        this.employees = {};
        this.currentEmployeeId = null;
    }

    addEmployee(employee) {
        const id = employee.id || Date.now().toString();
        this.employees[id] = {
            id,
            name: employee.name,
            position: employee.position,
            grade: employee.grade || '',
            department: employee.department || '',
            manager: employee.manager || null,
            email: employee.email || '',
            listReportsVertically: employee.listReportsVertically || false,
            training: [],
            objectives: [],
            tasks: []
        };
        this.saveToStorage();
        return id;
    }

    updateEmployee(id, updates) {
        if (this.employees[id]) {
            this.employees[id] = { ...this.employees[id], ...updates };
            this.saveToStorage();
        }
    }

    saveToStorage() {
        localStorage.setItem('teamData', JSON.stringify(this.employees));
    }

    loadFromStorage() {
        const data = localStorage.getItem('teamData');
        if (data) {
            try {
                this.employees = JSON.parse(data);
                // Migrate old data structure (skills -> training)
                Object.values(this.employees).forEach(emp => {
                    if (!emp.training && emp.skills) {
                        emp.training = emp.skills.map(skill => ({
                            id: skill.id,
                            name: skill.name,
                            type: 'Training',
                            date: ''
                        }));
                        delete emp.skills;
                    }
                    if (!emp.training) {
                        emp.training = [];
                    }
                });
                this.saveToStorage();
                return true;
            } catch (e) {
                console.error('Error loading from storage:', e);
                return false;
            }
        }
        return false;
    }

    getEmployee(id) {
        return this.employees[id];
    }

    deleteEmployee(id) {
        delete this.employees[id];
        this.saveToStorage();
    }

    getDirectReports(managerId) {
        return Object.values(this.employees).filter(emp => emp.manager === managerId);
    }

    getTopLevelEmployees() {
        return Object.values(this.employees).filter(emp => !emp.manager);
    }

    getDirectReportCount(employeeId) {
        return this.getDirectReports(employeeId).length;
    }

    getTotalReportCount(employeeId) {
        let total = 0;
        const directReports = this.getDirectReports(employeeId);
        
        directReports.forEach(report => {
            total += 1 + this.getTotalReportCount(report.id);
        });
        
        return total;
    }

    addTraining(employeeId, training) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.training.push({
                id: Date.now().toString(),
                name: training.name,
                type: training.type,
                date: training.date || ''
            });
            this.saveToStorage();
        }
    }

    deleteTraining(employeeId, trainingId) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.training = emp.training.filter(t => t.id !== trainingId);
            this.saveToStorage();
        }
    }

    addObjective(employeeId, objective) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.objectives.push({
                id: Date.now().toString(),
                text: objective.text,
                date: objective.date || ''
            });
            this.saveToStorage();
        }
    }

    deleteObjective(employeeId, objectiveId) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.objectives = emp.objectives.filter(o => o.id !== objectiveId);
            this.saveToStorage();
        }
    }

    addTask(employeeId, task) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.tasks.push({
                id: Date.now().toString(),
                text: task.text,
                priority: task.priority || 'medium',
                completed: false
            });
            this.saveToStorage();
        }
    }

    deleteTask(employeeId, taskId) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.tasks = emp.tasks.filter(t => t.id !== taskId);
            this.saveToStorage();
        }
    }

    toggleTask(employeeId, taskId) {
        const emp = this.employees[employeeId];
        if (emp) {
            const task = emp.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                this.saveToStorage();
            }
        }
    }
}

// UI Manager
class UIManager {
    constructor(teamManager) {
        this.tm = teamManager;
        this.sortColumn = 'name';
        this.sortAscending = true;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Load Data Screen
        document.getElementById('loadDataBtn').addEventListener('click', () => document.getElementById('loadDataFile').click());
        document.getElementById('loadDataFile').addEventListener('change', (e) => this.loadDataFromFile(e));
        document.getElementById('startNewBtn').addEventListener('click', () => this.startNewTeam());

        // Navigation
        document.getElementById('addEmployeeBtn').addEventListener('click', () => this.showEmployeeModal());
        document.getElementById('adminBtn').addEventListener('click', () => this.switchView('adminView'));
        document.getElementById('trainingBtn').addEventListener('click', () => this.switchView('trainingView'));
        document.getElementById('backBtn').addEventListener('click', () => this.switchView('orgChartView'));
        document.getElementById('backFromAdminBtn').addEventListener('click', () => this.switchView('orgChartView'));
        document.getElementById('backFromTrainingBtn').addEventListener('click', () => this.switchView('orgChartView'));
        document.getElementById('saveBtn').addEventListener('click', () => this.exportData());
        document.getElementById('editEmployeeBtn').addEventListener('click', () => this.showEmployeeModal(this.tm.currentEmployeeId));
        document.getElementById('updateManagerBtn').addEventListener('click', () => this.updateManager());
        document.getElementById('updateListLayoutBtn').addEventListener('click', () => this.updateListLayout());

        // Import/Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // Employee Form
        document.getElementById('employeeForm').addEventListener('submit', (e) => this.handleEmployeeSubmit(e));

        // Skill Form
        document.getElementById('addTrainingBtn').addEventListener('click', () => this.showTrainingModal());
        document.getElementById('trainingForm').addEventListener('submit', (e) => this.handleTrainingSubmit(e));

        // Objective Form
        document.getElementById('addObjectiveBtn').addEventListener('click', () => this.showObjectiveModal());
        document.getElementById('objectiveForm').addEventListener('submit', (e) => this.handleObjectiveSubmit(e));

        // Task Form
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('emailTasksBtn').addEventListener('click', () => this.emailTasks());
        document.getElementById('emailObjectivesBtn').addEventListener('click', () => this.emailObjectives());

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    loadDataFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                this.parseAndLoadCSV(csv);
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    parseAndLoadCSV(csv) {
        const lines = csv.trim().split('\n');
        
        console.log('CSV lines:', lines.length);
        
        if (lines.length < 2) {
            alert('CSV file is empty or invalid.');
            return;
        }

        // Parse headers (case-insensitive)
        const headers = [];
        const headerLine = lines[0];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < headerLine.length; j++) {
            const char = headerLine[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                headers.push(current.trim().replace(/^"|"$/g, '').toLowerCase());
                current = '';
            } else {
                current += char;
            }
        }
        headers.push(current.trim().replace(/^"|"$/g, '').toLowerCase());

        console.log('Headers:', headers);

        const typeIdx = headers.indexOf('type');
        const nameIdx = headers.indexOf('name');
        const positionIdx = headers.indexOf('position');
        const gradeIdx = headers.indexOf('grade');
        const departmentIdx = headers.indexOf('department');
        const managerIdx = headers.indexOf('manager');
        const emailIdx = headers.indexOf('email');
        const listVerticallyIdx = headers.indexOf('listvertically');
        const employeeNameIdx = headers.indexOf('employeename');
        const skillNameIdx = headers.indexOf('skillname');
        const skillLevelIdx = headers.indexOf('skilllevel');
        const trainingNameIdx = headers.indexOf('trainingname');
        const trainingTypeIdx = headers.indexOf('trainingtype');
        const trainingDateIdx = headers.indexOf('trainingdate');
        const objectiveIdx = headers.indexOf('objective');
        const targetDateIdx = headers.indexOf('targetdate');
        const taskIdx = headers.indexOf('task');
        const priorityIdx = headers.indexOf('priority');
        const completedIdx = headers.indexOf('completed');

        console.log('Column indices:', { typeIdx, nameIdx, positionIdx, gradeIdx, departmentIdx, managerIdx, emailIdx, listVerticallyIdx });

        const newEmployees = {};
        const managerMap = {};
        const trainingMap = {};
        const objectivesMap = {};
        const tasksMap = {};

        // Parse all rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line
            const fields = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            fields.push(current.trim().replace(/^"|"$/g, ''));

            const type = typeIdx !== -1 ? fields[typeIdx] : 'EMPLOYEE';

            if (type === 'EMPLOYEE' || typeIdx === -1) {
                const id = Date.now().toString() + Math.random();
                const name = nameIdx !== -1 ? fields[nameIdx] : '';
                const position = positionIdx !== -1 ? fields[positionIdx] : '';
                const grade = gradeIdx !== -1 ? fields[gradeIdx] : '';
                const department = departmentIdx !== -1 ? fields[departmentIdx] : '';
                const managerName = managerIdx !== -1 ? fields[managerIdx] : '';
                const email = emailIdx !== -1 ? fields[emailIdx] : '';
                const listVertically = listVerticallyIdx !== -1 && fields[listVerticallyIdx] === 'Yes';

                console.log(`Row ${i}:`, { name, position, grade, email });

                newEmployees[id] = {
                    id,
                    name,
                    position,
                    grade,
                    department,
                    manager: null,
                    email,
                    listReportsVertically: listVertically,
                    training: [],
                    objectives: [],
                    tasks: []
                };

                if (managerName) {
                    managerMap[id] = managerName;
                }
            } else if (type === 'TRAINING' || type === 'SKILL') {
                const empName = employeeNameIdx !== -1 ? fields[employeeNameIdx] : '';
                const trainingName = trainingNameIdx !== -1 ? fields[trainingNameIdx] : (skillNameIdx !== -1 ? fields[skillNameIdx] : '');
                const trainingType = trainingTypeIdx !== -1 ? fields[trainingTypeIdx] : 'Training';
                const trainingDate = trainingDateIdx !== -1 ? fields[trainingDateIdx] : '';

                if (!trainingMap[empName]) {
                    trainingMap[empName] = [];
                }
                trainingMap[empName].push({ name: trainingName, type: trainingType, date: trainingDate });
            } else if (type === 'OBJECTIVE') {
                const empName = employeeNameIdx !== -1 ? fields[employeeNameIdx] : '';
                const objective = objectiveIdx !== -1 ? fields[objectiveIdx] : '';
                const targetDate = targetDateIdx !== -1 ? fields[targetDateIdx] : '';

                if (!objectivesMap[empName]) {
                    objectivesMap[empName] = [];
                }
                objectivesMap[empName].push({ text: objective, date: targetDate });
            } else if (type === 'TASK') {
                const empName = employeeNameIdx !== -1 ? fields[employeeNameIdx] : '';
                const task = taskIdx !== -1 ? fields[taskIdx] : '';
                const priority = priorityIdx !== -1 ? fields[priorityIdx] : 'medium';
                const completed = completedIdx !== -1 && fields[completedIdx] === 'Yes';

                if (!tasksMap[empName]) {
                    tasksMap[empName] = [];
                }
                tasksMap[empName].push({ text: task, priority, completed });
            }
        }

        console.log('Created employees:', Object.keys(newEmployees).length);

        // Link managers
        Object.entries(managerMap).forEach(([empId, managerName]) => {
            const manager = Object.values(newEmployees).find(e => e.name === managerName);
            if (manager) {
                newEmployees[empId].manager = manager.id;
            }
        });

        // Add skills, objectives, and tasks
        Object.entries(newEmployees).forEach(([empId, emp]) => {
            if (trainingMap[emp.name]) {
                trainingMap[emp.name].forEach(training => {
                    emp.training.push({
                        id: Date.now().toString() + Math.random(),
                        name: training.name,
                        type: training.type,
                        date: training.date
                    });
                });
            }
            if (objectivesMap[emp.name]) {
                objectivesMap[emp.name].forEach(obj => {
                    emp.objectives.push({
                        id: Date.now().toString() + Math.random(),
                        text: obj.text,
                        date: obj.date
                    });
                });
            }
            if (tasksMap[emp.name]) {
                tasksMap[emp.name].forEach(task => {
                    emp.tasks.push({
                        id: Date.now().toString() + Math.random(),
                        text: task.text,
                        priority: task.priority,
                        completed: task.completed
                    });
                });
            }
        });

        this.tm.employees = newEmployees;
        this.tm.saveToStorage();
        console.log('Final employees:', Object.keys(this.tm.employees).length);
        this.switchView('orgChartView');
    }

    startNewTeam() {
        this.tm.employees = {};
        this.switchView('orgChartView');
    }

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');

        if (viewId === 'orgChartView') {
            this.renderOrgChart();
        } else if (viewId === 'adminView') {
            this.renderAdminTable();
        } else if (viewId === 'trainingView') {
            this.renderTrainingView();
        }
    }

    renderTrainingView() {
        const container = document.getElementById('trainingContent');
        const employees = Object.values(this.tm.employees)
            .filter(emp => emp.training && emp.training.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (employees.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No training or certifications recorded.</p>';
            return;
        }

        container.innerHTML = employees.map(emp => {
            const trainingItems = emp.training.map(training => `
                <div class="training-card-item">
                    <div>
                        <div class="training-card-name">${training.name}</div>
                        <span class="training-badge ${training.type.toLowerCase()}">${training.type}</span>
                    </div>
                    <div class="training-card-date">${training.date ? new Date(training.date).toLocaleDateString() : 'N/A'}</div>
                </div>
            `).join('');

            return `
                <div class="training-card">
                    <div class="training-card-header">${emp.name}</div>
                    ${trainingItems}
                </div>
            `;
        }).join('');
    }

    renderOrgChart() {
        const container = document.getElementById('orgChart');
        container.innerHTML = '';

        const topLevel = this.tm.getTopLevelEmployees();
        
        if (topLevel.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No employees yet. Add one to get started!</p>';
            return;
        }

        const tree = document.createElement('div');
        tree.className = 'org-tree';

        topLevel.forEach(emp => {
            tree.appendChild(this.buildOrgNode(emp));
        });

        container.appendChild(tree);
    }

    buildOrgNode(employee) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '20px';

        const directReports = this.tm.getDirectReportCount(employee.id);
        const totalReports = this.tm.getTotalReportCount(employee.id);

        const node = document.createElement('div');
        node.className = 'org-node';
        node.classList.add(`grade-${employee.grade}`);
        
        let reportText = '';
        if (directReports > 0) {
            reportText = `<div class="org-node-reports">📊 ${directReports} direct${directReports === 1 ? '' : 's'}`;
            if (totalReports > directReports) {
                reportText += ` (${totalReports} total)`;
            }
            reportText += '</div>';
        }

        node.innerHTML = `
            <div class="org-node-name">${employee.name}</div>
            <div class="org-node-position">${employee.position}</div>
            <div class="org-node-grade">${employee.grade}</div>
            ${employee.department ? `<div class="org-node-department">${employee.department}</div>` : ''}
            ${reportText}
        `;
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => this.showEmployeeDetail(employee.id));

        container.appendChild(node);

        const directReportsList = this.tm.getDirectReports(employee.id);
        if (directReportsList.length > 0) {
            const level = document.createElement('div');
            
            if (employee.listReportsVertically) {
                level.className = 'org-level list-layout';
            } else {
                level.className = 'org-level';
            }

            directReportsList.forEach(report => {
                level.appendChild(this.buildOrgNode(report));
            });

            container.appendChild(level);
        }

        return container;
    }

    renderAdminTable() {
        const tbody = document.getElementById('adminTableBody');
        let employees = Object.values(this.tm.employees);

        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No employees yet.</td></tr>';
            return;
        }

        // Sort employees
        employees.sort((a, b) => {
            let aVal, bVal;

            switch(this.sortColumn) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'position':
                    aVal = a.position.toLowerCase();
                    bVal = b.position.toLowerCase();
                    break;
                case 'grade':
                    // Custom grade order
                    const gradeOrder = { 'PO6': 0, 'PO4': 1, 'PO2': 2, 'SO1': 3, 'A3': 4, 'Contractor': 5, 'Student': 6 };
                    aVal = gradeOrder[a.grade] !== undefined ? gradeOrder[a.grade] : 999;
                    bVal = gradeOrder[b.grade] !== undefined ? gradeOrder[b.grade] : 999;
                    break;
                case 'department':
                    aVal = (a.department || '').toLowerCase();
                    bVal = (b.department || '').toLowerCase();
                    break;
                case 'manager':
                    aVal = (a.manager ? this.tm.getEmployee(a.manager)?.name : '').toLowerCase();
                    bVal = (b.manager ? this.tm.getEmployee(b.manager)?.name : '').toLowerCase();
                    break;
                case 'email':
                    aVal = (a.email || '').toLowerCase();
                    bVal = (b.email || '').toLowerCase();
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }

            if (aVal < bVal) return this.sortAscending ? -1 : 1;
            if (aVal > bVal) return this.sortAscending ? 1 : -1;
            return 0;
        });

        tbody.innerHTML = employees.map(emp => {
            const manager = emp.manager ? this.tm.getEmployee(emp.manager) : null;
            return `
                <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.position}</td>
                    <td><span class="grade-badge grade-${emp.grade}">${emp.grade}</span></td>
                    <td>${emp.department || '-'}</td>
                    <td>${manager ? manager.name : '-'}</td>
                    <td>${emp.email || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn" onclick="uiManager.showEmployeeDetail('${emp.id}')">View</button>
                            <button class="delete-btn" onclick="uiManager.deleteEmployeeConfirm('${emp.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortAscending = !this.sortAscending;
        } else {
            this.sortColumn = column;
            this.sortAscending = true;
        }
        this.renderAdminTable();
    }

    showEmployeeDetail(employeeId) {
        this.tm.currentEmployeeId = employeeId;
        const emp = this.tm.getEmployee(employeeId);

        document.getElementById('employeeName').textContent = emp.name;

        const infoHtml = `
            <div class="info-row">
                <span class="info-label">Position</span>
                <span class="info-value">${emp.position}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Grade</span>
                <span class="info-value"><span class="grade-badge grade-${emp.grade}">${emp.grade}</span></span>
            </div>
            ${emp.department ? `
            <div class="info-row">
                <span class="info-label">Department</span>
                <span class="info-value">${emp.department}</span>
            </div>
            ` : ''}
            ${emp.email ? `
            <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${emp.email}</span>
            </div>
            ` : ''}
        `;
        document.getElementById('employeeInfo').innerHTML = infoHtml;

        const managerSelect = document.getElementById('managerSelect');
        managerSelect.innerHTML = '<option value="">None (Top-level)</option>';
        Object.values(this.tm.employees).forEach(e => {
            if (e.id !== employeeId) {
                const option = document.createElement('option');
                option.value = e.id;
                option.textContent = `${e.name} (${e.position})`;
                managerSelect.appendChild(option);
            }
        });
        managerSelect.value = emp.manager || '';

        document.getElementById('listReportsVerticallyCheckbox').checked = emp.listReportsVertically === true;

        this.renderTraining(emp);
        this.renderObjectives(emp);
        this.renderTasks(emp);

        this.switchView('employeeDetailView');
    }

    renderTraining(emp) {
        const container = document.getElementById('trainingList');
        if (!emp.training || emp.training.length === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 14px;">No training or certifications added yet.</p>';
            return;
        }

        container.innerHTML = emp.training.map(training => `
            <div class="training-item ${training.type.toLowerCase()}">
                <div>
                    <div class="training-name">${training.name}</div>
                    <div class="training-type">
                        <span class="training-badge ${training.type.toLowerCase()}">${training.type}</span>
                        ${training.date ? ` • ${new Date(training.date).toLocaleDateString()}` : ''}
                    </div>
                </div>
                <button class="delete-btn" onclick="uiManager.deleteTraining('${emp.id}', '${training.id}')">Delete</button>
            </div>
        `).join('');
    }

    renderObjectives(emp) {
        const container = document.getElementById('objectivesList');
        if (emp.objectives.length === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 14px;">No objectives set yet.</p>';
            return;
        }

        container.innerHTML = emp.objectives.map(obj => `
            <div class="objective-item">
                <div style="width: 100%;">
                    <div class="objective-text">${obj.text}</div>
                    ${obj.date ? `<div class="objective-date">Target: ${new Date(obj.date).toLocaleDateString()}</div>` : ''}
                </div>
                <button class="delete-btn" onclick="uiManager.deleteObjective('${emp.id}', '${obj.id}')">Delete</button>
            </div>
        `).join('');
    }

    renderTasks(emp) {
        const container = document.getElementById('tasksList');
        if (emp.tasks.length === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 14px;">No tasks for next 1-2-1 session.</p>';
            return;
        }

        container.innerHTML = emp.tasks.map(task => `
            <div class="task-item" style="opacity: ${task.completed ? 0.6 : 1};">
                <div style="width: 100%; display: flex; gap: 10px; align-items: flex-start;">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                        onchange="uiManager.toggleTask('${emp.id}', '${task.id}')" 
                        style="margin-top: 3px; cursor: pointer;">
                    <div style="flex: 1;">
                        <div class="task-text" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</div>
                        <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="uiManager.deleteTask('${emp.id}', '${task.id}')">Delete</button>
            </div>
        `).join('');
    }

    showEmployeeModal(employeeId = null) {
        const modal = document.getElementById('employeeModal');
        const form = document.getElementById('employeeForm');
        const title = document.getElementById('modalTitle');
        const managerSelect = document.getElementById('empManager');

        form.reset();
        document.getElementById('employeeId').value = '';

        managerSelect.innerHTML = '<option value="">None (Top-level)</option>';
        Object.values(this.tm.employees).forEach(emp => {
            if (!employeeId || emp.id !== employeeId) {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.name} (${emp.position})`;
                managerSelect.appendChild(option);
            }
        });

        if (employeeId) {
            const emp = this.tm.getEmployee(employeeId);
            title.textContent = 'Edit Employee';
            document.getElementById('employeeId').value = emp.id;
            document.getElementById('empName').value = emp.name;
            document.getElementById('empPosition').value = emp.position;
            document.getElementById('empGrade').value = emp.grade || '';
            document.getElementById('empDepartment').value = emp.department;
            document.getElementById('empManager').value = emp.manager || '';
            document.getElementById('empEmail').value = emp.email;
        } else {
            title.textContent = 'Add Employee';
        }

        modal.classList.add('show');
    }

    handleEmployeeSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('employeeId').value;
        const employee = {
            id: id || undefined,
            name: document.getElementById('empName').value,
            position: document.getElementById('empPosition').value,
            grade: document.getElementById('empGrade').value,
            department: document.getElementById('empDepartment').value,
            manager: document.getElementById('empManager').value || null,
            email: document.getElementById('empEmail').value
        };

        if (id) {
            this.tm.updateEmployee(id, employee);
        } else {
            this.tm.addEmployee(employee);
        }

        document.getElementById('employeeModal').classList.remove('show');
        this.renderOrgChart();
    }

    updateManager() {
        const newManagerId = document.getElementById('managerSelect').value || null;
        this.tm.updateEmployee(this.tm.currentEmployeeId, { manager: newManagerId });
        this.showEmployeeDetail(this.tm.currentEmployeeId);
    }

    updateListLayout() {
        const listVertically = document.getElementById('listReportsVerticallyCheckbox').checked;
        this.tm.updateEmployee(this.tm.currentEmployeeId, { listReportsVertically: listVertically });
        this.renderOrgChart();
        this.showEmployeeDetail(this.tm.currentEmployeeId);
    }

    deleteEmployeeConfirm(employeeId) {
        const emp = this.tm.getEmployee(employeeId);
        if (confirm(`Are you sure you want to delete ${emp.name}? Any direct reports will become top-level employees.`)) {
            this.tm.deleteEmployee(employeeId);
            this.renderAdminTable();
        }
    }

    exportData() {
        const employees = Object.values(this.tm.employees);
        
        const rows = [];

        employees.forEach(emp => {
            const managerName = emp.manager ? (this.tm.getEmployee(emp.manager)?.name || '') : '';
            
            // Employee main row
            rows.push({
                type: 'EMPLOYEE',
                id: emp.id,
                name: emp.name,
                position: emp.position,
                grade: emp.grade,
                department: emp.department,
                manager: managerName,
                email: emp.email,
                listVertically: emp.listReportsVertically ? 'Yes' : 'No'
            });

            // Skills rows
            if (emp.training.length > 0) {
                emp.training.forEach(training => {
                    rows.push({
                        type: 'TRAINING',
                        employeeName: emp.name,
                        trainingName: training.name,
                        trainingType: training.type,
                        trainingDate: training.date || ''
                    });
                });
            }

            // Objectives rows
            if (emp.objectives.length > 0) {
                emp.objectives.forEach(obj => {
                    rows.push({
                        type: 'OBJECTIVE',
                        employeeName: emp.name,
                        objective: obj.text,
                        targetDate: obj.date || ''
                    });
                });
            }

            // Tasks rows
            if (emp.tasks.length > 0) {
                emp.tasks.forEach(task => {
                    rows.push({
                        type: 'TASK',
                        employeeName: emp.name,
                        task: task.text,
                        priority: task.priority,
                        completed: task.completed ? 'Yes' : 'No'
                    });
                });
            }
        });

        // Get all unique keys in order
        const allKeys = new Set();
        rows.forEach(row => {
            Object.keys(row).forEach(key => allKeys.add(key));
        });
        const headers = Array.from(allKeys);

        // Create CSV
        const csvLines = [headers.join(',')];
        rows.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                const escaped = String(value).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            });
            csvLines.push(values.join(','));
        });

        const csv = csvLines.join('\n');
        
        const dataBlob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'team_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                this.parseAndLoadCSV(csv);
            } catch (error) {
                alert('Error reading file: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    showTrainingModal() {
        document.getElementById('trainingForm').reset();
        document.getElementById('trainingModal').classList.add('show');
    }

    handleTrainingSubmit(e) {
        e.preventDefault();
        this.tm.addTraining(this.tm.currentEmployeeId, {
            name: document.getElementById('trainingName').value,
            type: document.getElementById('trainingType').value,
            date: document.getElementById('trainingDate').value
        });
        document.getElementById('trainingModal').classList.remove('show');
        this.showEmployeeDetail(this.tm.currentEmployeeId);
    }

    deleteTraining(employeeId, trainingId) {
        this.tm.deleteTraining(employeeId, trainingId);
        this.showEmployeeDetail(employeeId);
    }

    showObjectiveModal() {
        document.getElementById('objectiveForm').reset();
        document.getElementById('objectiveModal').classList.add('show');
    }

    handleObjectiveSubmit(e) {
        e.preventDefault();
        this.tm.addObjective(this.tm.currentEmployeeId, {
            text: document.getElementById('objectiveText').value,
            date: document.getElementById('objectiveDate').value
        });
        document.getElementById('objectiveModal').classList.remove('show');
        this.showEmployeeDetail(this.tm.currentEmployeeId);
    }

    deleteObjective(employeeId, objectiveId) {
        this.tm.deleteObjective(employeeId, objectiveId);
        this.showEmployeeDetail(employeeId);
    }

    showTaskModal() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskModal').classList.add('show');
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        this.tm.addTask(this.tm.currentEmployeeId, {
            text: document.getElementById('taskText').value,
            priority: document.getElementById('taskPriority').value
        });
        document.getElementById('taskModal').classList.remove('show');
        this.showEmployeeDetail(this.tm.currentEmployeeId);
    }

    deleteTask(employeeId, taskId) {
        this.tm.deleteTask(employeeId, taskId);
        this.showEmployeeDetail(employeeId);
    }

    toggleTask(employeeId, taskId) {
        this.tm.toggleTask(employeeId, taskId);
        this.showEmployeeDetail(employeeId);
    }

    emailTasks() {
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        if (!emp.email) {
            alert('No email address on file for this employee.');
            return;
        }

        if (emp.tasks.length === 0) {
            alert('No tasks to email.');
            return;
        }

        const taskList = emp.tasks.map(task => 
            `• ${task.text} (Priority: ${task.priority.toUpperCase()})`
        ).join('\n');

        const subject = `1-2-1 Session Tasks - ${emp.name}`;
        const body = `Hi ${emp.name},\n\nHere are your tasks for the upcoming 1-2-1 session:\n\n${taskList}\n\nPlease let me know if you have any questions.\n\nBest regards`;

        const mailtoLink = `mailto:${emp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }

    emailObjectives() {
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        if (!emp.email) {
            alert('No email address on file for this employee.');
            return;
        }

        if (emp.objectives.length === 0) {
            alert('No objectives to email.');
            return;
        }

        const objectiveList = emp.objectives.map(obj => 
            `• ${obj.text}${obj.date ? ` (Target: ${new Date(obj.date).toLocaleDateString()})` : ''}`
        ).join('\n');

        const subject = `Objectives - ${emp.name}`;
        const body = `Hi ${emp.name},\n\nHere are your current objectives:\n\n${objectiveList}\n\nPlease let me know if you have any questions or need any support.\n\nBest regards`;

        const mailtoLink = `mailto:${emp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }
}

// Initialize
let teamManager;
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    teamManager = new TeamManager();
    const hasData = teamManager.loadFromStorage();
    uiManager = new UIManager(teamManager);
    
    // If data exists, go straight to org chart, otherwise show load screen
    if (hasData && Object.keys(teamManager.employees).length > 0) {
        uiManager.switchView('orgChartView');
    }
});

// Data is now auto-saved to disk, no need to prompt on close
