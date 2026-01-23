// Data Management with Electron file persistence
class TeamManager {
    constructor() {
        this.employees = {};
        this.currentEmployeeId = null;
    }

    async loadFromDisk() {
        try {
            if (window.electronAPI) {
                const data = await window.electronAPI.loadData();
                this.employees = data || {};
                return Object.keys(this.employees).length > 0;
            } else {
                // Fallback to localStorage for web version
                return this.loadFromStorage();
            }
        } catch (e) {
            console.error('Error loading from disk:', e);
            return false;
        }
    }

    async saveToDisk() {
        try {
            if (window.electronAPI) {
                await window.electronAPI.saveData(this.employees);
            } else {
                // Fallback to localStorage for web version
                this.saveToStorage();
            }
        } catch (e) {
            console.error('Error saving to disk:', e);
        }
    }

    loadFromStorage() {
        const data = localStorage.getItem('teamData');
        if (data) {
            try {
                this.employees = JSON.parse(data);
                return true;
            } catch (e) {
                console.error('Error loading from storage:', e);
                return false;
            }
        }
        return false;
    }

    saveToStorage() {
        localStorage.setItem('teamData', JSON.stringify(this.employees));
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
        this.saveToDisk();
        return id;
    }

    updateEmployee(id, updates) {
        if (this.employees[id]) {
            this.employees[id] = { ...this.employees[id], ...updates };
            this.saveToDisk();
        }
    }

    getEmployee(id) {
        return this.employees[id];
    }

    deleteEmployee(id) {
        delete this.employees[id];
        this.saveToDisk();
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
            this.saveToDisk();
        }
    }

    deleteTraining(employeeId, trainingId) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.training = emp.training.filter(t => t.id !== trainingId);
            this.saveToDisk();
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
            this.saveToDisk();
        }
    }

    deleteObjective(employeeId, objectiveId) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.objectives = emp.objectives.filter(o => o.id !== objectiveId);
            this.saveToDisk();
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
            this.saveToDisk();
        }
    }

    deleteTask(employeeId, taskId) {
        const emp = this.employees[employeeId];
        if (emp) {
            emp.tasks = emp.tasks.filter(t => t.id !== taskId);
            this.saveToDisk();
        }
    }

    toggleTask(employeeId, taskId) {
        const emp = this.employees[employeeId];
        if (emp) {
            const task = emp.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                this.saveToDisk();
            }
        }
    }
}

// Initialize
let tm;
let uiManager;

document.addEventListener('DOMContentLoaded', async () => {
    tm = new TeamManager();
    uiManager = new UIManager(tm);
    
    const hasData = await tm.loadFromDisk();
    if (hasData) {
        uiManager.switchView('orgChartView');
    } else {
        uiManager.switchView('loadDataView');
    }
});
