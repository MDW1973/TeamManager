// This script initializes the app with your team_data.csv on first run
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function initializeWithCSV() {
    const csvPath = path.join(__dirname, 'team_data.csv');
    const userDataPath = app.getPath('userData');
    const dataFilePath = path.join(userDataPath, 'team-data.json');
    
    // Only initialize if data file doesn't exist
    if (fs.existsSync(dataFilePath)) {
        return;
    }
    
    // Check if CSV exists
    if (!fs.existsSync(csvPath)) {
        return;
    }
    
    try {
        const csv = fs.readFileSync(csvPath, 'utf8');
        const lines = csv.trim().split('\n');
        
        if (lines.length < 2) {
            return;
        }

        // Parse headers
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

        // Parse all rows
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
                const id = nameIdx !== -1 ? fields[nameIdx] + '_' + Date.now() : Date.now().toString();
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
                const trainingName = trainingNameIdx !== -1 ? fields[trainingNameIdx] : '';
                const trainingType = trainingTypeIdx !== -1 ? fields[trainingTypeIdx] : 'Training';
                const trainingDate = trainingDateIdx !== -1 ? fields[trainingDateIdx] : '';

                if (!trainingMap[empName]) {
                    trainingMap[empName] = [];
                }
                if (trainingName) {
                    trainingMap[empName].push({ name: trainingName, type: trainingType, date: trainingDate });
                }
            } else if (type === 'OBJECTIVE') {
                const empName = employeeNameIdx !== -1 ? fields[employeeNameIdx] : '';
                const objective = objectiveIdx !== -1 ? fields[objectiveIdx] : '';
                const targetDate = targetDateIdx !== -1 ? fields[targetDateIdx] : '';

                if (!objectivesMap[empName]) {
                    objectivesMap[empName] = [];
                }
                if (objective) {
                    objectivesMap[empName].push({ text: objective, date: targetDate });
                }
            } else if (type === 'TASK') {
                const empName = employeeNameIdx !== -1 ? fields[employeeNameIdx] : '';
                const task = taskIdx !== -1 ? fields[taskIdx] : '';
                const priority = priorityIdx !== -1 ? fields[priorityIdx] : 'medium';
                const completed = completedIdx !== -1 && fields[completedIdx] === 'Yes';

                if (!tasksMap[empName]) {
                    tasksMap[empName] = [];
                }
                if (task) {
                    tasksMap[empName].push({ text: task, priority, completed });
                }
            }
        }

        // Link managers
        Object.entries(managerMap).forEach(([empId, managerName]) => {
            const manager = Object.values(newEmployees).find(e => e.name === managerName);
            if (manager) {
                newEmployees[empId].manager = manager.id;
            }
        });

        // Add training, objectives, and tasks
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

        // Save to persistent storage
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        fs.writeFileSync(dataFilePath, JSON.stringify(newEmployees, null, 2), 'utf8');
        console.log('Initialized with CSV data:', Object.keys(newEmployees).length, 'employees');
    } catch (error) {
        console.error('Error initializing with CSV:', error);
    }
}

module.exports = { initializeWithCSV };
