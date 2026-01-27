import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TeamManager } from './components/TeamManager';
import { DailyTasks } from './components/DailyTasks';
import { WorkingHours } from './components/WorkingHours';
import { TrainingCertifications } from './components/TrainingCertifications';
import { Calendar } from './components/Calendar';
import './App.css';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'team' | 'tasks' | 'hours' | 'training' | 'calendar'>('team');
  const [navigateToDate, setNavigateToDate] = useState<string | null>(null);
  const [navigateToEmployeeId, setNavigateToEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const handleNavigateToDailyTasks = (e: Event) => {
      const customEvent = e as CustomEvent;
      setNavigateToDate(customEvent.detail.date);
      setActiveSection('tasks');
    };

    const handleNavigateToEmployee = (e: Event) => {
      const customEvent = e as CustomEvent;
      setNavigateToEmployeeId(customEvent.detail.employeeId);
      setActiveSection('team');
    };

    window.addEventListener('navigateToDailyTasks', handleNavigateToDailyTasks);
    window.addEventListener('navigateToEmployee', handleNavigateToEmployee);

    return () => {
      window.removeEventListener('navigateToDailyTasks', handleNavigateToDailyTasks);
      window.removeEventListener('navigateToEmployee', handleNavigateToEmployee);
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="main-content">
        {activeSection === 'team' && <TeamManager navigateToEmployeeId={navigateToEmployeeId} />}
        {activeSection === 'tasks' && <DailyTasks navigateToDate={navigateToDate} />}
        {activeSection === 'hours' && <WorkingHours />}
        {activeSection === 'training' && <TrainingCertifications />}
        {activeSection === 'calendar' && <Calendar />}
      </main>
    </div>
  );
};
