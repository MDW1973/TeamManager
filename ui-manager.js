// UI Manager
class UIManager {
    constructor(teamManager) {
        this.tm = teamManager;
        this.sortColumn = 'name';
        this.sortAscending = true;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('addEmployeeBtn').addEventListener('click', () => this.showEmployeeModal());
        document.getElementById('adminBtn').addEventListener('click', () => this.switchView('adminView'));
        document.getElementById('trainingBtn').addEventListener('click', () => this.switchView('trainingView'));
        document.getElementById('backBtn').addEventListener('click', () => this.switchView('orgChartView'));
        document.getElementById('backFromAdminBtn').addEventListener('click', () => this.switchView('orgChartView'));
        document.getElementById('backFromTrainingBtn').addEventListener('click', () => this.switchView('orgChartView'));
        document.getElementById('editEmployeeBtn').addEventListener('click', () => this.showEmployeeModal(this.tm.currentEmployeeId));
        document.getElementById('updateManagerBtn').addEventListener('click', () => this.updateManager());
        document.getElementById('updateListLayoutBtn').addEventListener('click', () => this.updateListLayout());

        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        document.getElementById('employeeForm').addEventListener('submit', (e) => this.handleEmployeeSubmit(e));
        document.getElementById('addTrainingBtn').addEventListener('click', () => this.showTrainingModal());
        document.getElementById('trainingForm').addEventListener('submit', (e) => this.handleTrainingSubmit(e));
        document.getElementById('addObjectiveBtn').addEventListener('click', () => this.showObjectiveModal());
        document.getElementById('objectiveForm').addEventListener('submit', (e) => this.handleObjectiveSubmit(e));
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('emailTasksBtn').addEventListener('click', () => this.emailTasks());
        document.getElementById('emailObjectivesBtn').addEventListener('click', () => this.emailObjectives());

        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
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

    async showEmployeeDetail(employeeId) {
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
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="uiManager.toggleTask('${emp.id}', '${task.id}')">
                    <div style="flex: 1;">
                        <div class="task-text" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</div>
                        <div class="task-priority">Priority: <span class="priority-${task.priority}">${task.priority}</span></div>
                    </div>
                </div>
                <button class="delete-btn" onclick="uiManager.deleteTask('${emp.id}', '${task.id}')">Delete</button>
            </div>
        `).join('');
    }
}

    showEmployeeModal(employeeId = null) {
        const modal = document.getElementById('employeeModal');
        const form = document.getElementById('employeeForm');
        
        if (employeeId) {
            const emp = this.tm.getEmployee(employeeId);
            document.getElementById('employeeName_input').value = emp.name;
            document.getElementById('employeePosition').value = emp.position;
            document.getElementById('employeeGrade').value = emp.grade;
            document.getElementById('employeeDepartment').value = emp.department;
            document.getElementById('employeeEmail').value = emp.email;
            form.dataset.employeeId = employeeId;
        } else {
            form.reset();
            delete form.dataset.employeeId;
        }

        const managerSelect = document.getElementById('employeeManager');
        managerSelect.innerHTML = '<option value="">None (Top-level)</option>';
        Object.values(this.tm.employees).forEach(e => {
            if (!employeeId || e.id !== employeeId) {
                const option = document.createElement('option');
                option.value = e.id;
                option.textContent = `${e.name} (${e.position})`;
                managerSelect.appendChild(option);
            }
        });

        if (employeeId) {
            const emp = this.tm.getEmployee(employeeId);
            managerSelect.value = emp.manager || '';
        }

        modal.classList.add('show');
    }

    async handleEmployeeSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const employeeId = form.dataset.employeeId;

        const employee = {
            name: document.getElementById('employeeName_input').value,
            position: document.getElementById('employeePosition').value,
            grade: document.getElementById('employeeGrade').value,
            department: document.getElementById('employeeDepartment').value,
            manager: document.getElementById('employeeManager').value || null,
            email: document.getElementById('employeeEmail').value
        };

        if (employeeId) {
            await this.tm.updateEmployee(employeeId, employee);
        } else {
            await this.tm.addEmployee(employee);
        }

        document.getElementById('employeeModal').classList.remove('show');
        this.renderOrgChart();
    }

    showTrainingModal() {
        document.getElementById('trainingForm').reset();
        document.getElementById('trainingModal').classList.add('show');
    }

    async handleTrainingSubmit(e) {
        e.preventDefault();
        const training = {
            name: document.getElementById('trainingName').value,
            type: document.getElementById('trainingType').value,
            date: document.getElementById('trainingDate').value
        };

        await this.tm.addTraining(this.tm.currentEmployeeId, training);
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        this.renderTraining(emp);
        document.getElementById('trainingModal').classList.remove('show');
    }

    async deleteTraining(employeeId, trainingId) {
        if (confirm('Delete this training/certification?')) {
            await this.tm.deleteTraining(employeeId, trainingId);
            const emp = this.tm.getEmployee(employeeId);
            this.renderTraining(emp);
        }
    }

    showObjectiveModal() {
        document.getElementById('objectiveForm').reset();
        document.getElementById('objectiveModal').classList.add('show');
    }

    async handleObjectiveSubmit(e) {
        e.preventDefault();
        const objective = {
            text: document.getElementById('objectiveText').value,
            date: document.getElementById('objectiveDate').value
        };

        await this.tm.addObjective(this.tm.currentEmployeeId, objective);
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        this.renderObjectives(emp);
        document.getElementById('objectiveModal').classList.remove('show');
    }

    async deleteObjective(employeeId, objectiveId) {
        if (confirm('Delete this objective?')) {
            await this.tm.deleteObjective(employeeId, objectiveId);
            const emp = this.tm.getEmployee(employeeId);
            this.renderObjectives(emp);
        }
    }

    showTaskModal() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskModal').classList.add('show');
    }

    async handleTaskSubmit(e) {
        e.preventDefault();
        const task = {
            text: document.getElementById('taskText').value,
            priority: document.getElementById('taskPriority').value,
            completed: false
        };

        await this.tm.addTask(this.tm.currentEmployeeId, task);
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        this.renderTasks(emp);
        document.getElementById('taskModal').classList.remove('show');
    }

    async deleteTask(employeeId, taskId) {
        if (confirm('Delete this task?')) {
            await this.tm.deleteTask(employeeId, taskId);
            const emp = this.tm.getEmployee(employeeId);
            this.renderTasks(emp);
        }
    }

    async toggleTask(employeeId, taskId) {
        await this.tm.toggleTask(employeeId, taskId);
        const emp = this.tm.getEmployee(employeeId);
        this.renderTasks(emp);
    }

    async updateManager() {
        const managerId = document.getElementById('managerSelect').value || null;
        await this.tm.updateEmployee(this.tm.currentEmployeeId, { manager: managerId });
        this.renderOrgChart();
    }

    async updateListLayout() {
        const listVertically = document.getElementById('listReportsVerticallyCheckbox').checked;
        await this.tm.updateEmployee(this.tm.currentEmployeeId, { listReportsVertically: listVertically });
        this.renderOrgChart();
    }

    async deleteEmployeeConfirm(employeeId) {
        const emp = this.tm.getEmployee(employeeId);
        if (confirm(`Delete ${emp.name}?`)) {
            await this.tm.deleteEmployee(employeeId);
            this.renderAdminTable();
        }
    }

    emailTasks() {
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        if (!emp.email) {
            alert('No email address on file');
            return;
        }

        const taskList = emp.tasks.map(t => `• ${t.text} (${t.priority})`).join('\n');
        const subject = `1-2-1 Session Tasks for ${emp.name}`;
        const body = `Tasks for next 1-2-1 session:\n\n${taskList}`;
        
        window.location.href = `mailto:${emp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    emailObjectives() {
        const emp = this.tm.getEmployee(this.tm.currentEmployeeId);
        if (!emp.email) {
            alert('No email address on file');
            return;
        }

        const objList = emp.objectives.map(o => `• ${o.text}${o.date ? ` (Target: ${new Date(o.date).toLocaleDateString()})` : ''}`).join('\n');
        const subject = `Objectives for ${emp.name}`;
        const body = `Objectives:\n\n${objList}`;
        
        window.location.href = `mailto:${emp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    exportData() {
        const employees = Object.values(this.tm.employees);
        let csv = 'type,id,name,position,grade,department,manager,email,listVertically,employeeName,task,priority,completed,trainingName,trainingType,trainingDate,objective,targetDate\n';

        employees.forEach(emp => {
            const managerName = emp.manager ? this.tm.getEmployee(emp.manager)?.name : '';
            csv += `EMPLOYEE,${emp.id},"${emp.name}","${emp.position}","${emp.grade}","${emp.department}","${managerName}","${emp.email}","${emp.listReportsVertically ? 'Yes' : 'No'}"\n`;

            emp.tasks.forEach(task => {
                csv += `TASK,,,,,,,,"${emp.name}","${task.text}","${task.priority}","${task.completed ? 'Yes' : 'No'}"\n`;
            });

            emp.training.forEach(training => {
                csv += `TRAINING,,,,,,,,"${emp.name}","","","","${training.name}","${training.type}","${training.date}"\n`;
            });

            emp.objectives.forEach(obj => {
                csv += `OBJECTIVE,,,,,,,,"${emp.name}","","","","","","${obj.text}","${obj.date}"\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csv = event.target.result;
                await this.parseAndLoadCSV(csv);
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    async parseAndLoadCSV(csv) {
        const lines = csv.trim().split('\n');
        
        if (lines.length < 2) {
            alert('CSV file is empty or invalid.');
            return;
        }

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
        const trainingNameIdx = headers.indexOf('trainingname');
        const trainingTypeIdx = headers.indexOf('trainingtype');
        const trainingDateIdx = headers.indexOf('trainingdate');
        const objectiveIdx = headers.indexOf('objective');
        const targetDateIdx = headers.indexOf('targetdate');
        const taskIdx = headers.indexOf('task');
        const priorityIdx = headers.indexOf('priority');
        const completedIdx = headers.indexOf('completed');

        const newEmployees = {};
        const managerMap = {};
        const trainingMap = {};
        const objectivesMap = {};
        const tasksMap = {};

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

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

        Object.entries(managerMap).forEach(([empId, managerName]) => {
            const manager = Object.values(newEmployees).find(e => e.name === managerName);
            if (manager) {
                newEmployees[empId].manager = manager.id;
            }
        });

        for (const [empId, emp] of Object.entries(newEmployees)) {
            if (trainingMap[emp.name]) {
                for (const training of trainingMap[emp.name]) {
                    await this.tm.addTraining(empId, training);
                }
            }
            if (objectivesMap[emp.name]) {
                for (const obj of objectivesMap[emp.name]) {
                    await this.tm.addObjective(empId, obj);
                }
            }
            if (tasksMap[emp.name]) {
                for (const task of tasksMap[emp.name]) {
                    await this.tm.addTask(empId, task);
                }
            }
        }

        this.tm.employees = newEmployees;
        this.switchView('orgChartView');
    }
