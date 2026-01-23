import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeSection: 'team' | 'tasks' | 'hours';
  onSectionChange: (section: 'team' | 'tasks' | 'hours') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">Manager Pro</h1>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Team Management</h3>
          <button
            className={`nav-item ${activeSection === 'team' ? 'active' : ''}`}
            onClick={() => onSectionChange('team')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Team Manager</span>
          </button>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Daily Work</h3>
          <button
            className={`nav-item ${activeSection === 'tasks' ? 'active' : ''}`}
            onClick={() => onSectionChange('tasks')}
          >
            <span className="nav-icon">✓</span>
            <span className="nav-label">Daily Tasks</span>
          </button>
          <button
            className={`nav-item ${activeSection === 'hours' ? 'active' : ''}`}
            onClick={() => onSectionChange('hours')}
          >
            <span className="nav-icon">⏱️</span>
            <span className="nav-label">Working Hours</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <p className="version">v1.0.0</p>
      </div>
    </aside>
  );
};
