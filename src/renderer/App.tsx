import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TeamManager } from './components/TeamManager';
import { DailyTasks } from './components/DailyTasks';
import { WorkingHours } from './components/WorkingHours';
import './App.css';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'team' | 'tasks' | 'hours'>('team');

  return (
    <div className="app-container">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="main-content">
        {activeSection === 'team' && <TeamManager />}
        {activeSection === 'tasks' && <DailyTasks />}
        {activeSection === 'hours' && <WorkingHours />}
      </main>
    </div>
  );
};
