import React, { useState, useEffect } from 'react';
import './TrainingCertifications.css';

export const TrainingCertifications: React.FC = () => {
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [certificationData, setCertificationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const employees = await window.electronAPI.team.getAllEmployees();
      
      // Aggregate training courses
      const trainingMap = new Map<string, { name: string; employees: string[]; dates: string[] }>();
      const certificationMap = new Map<string, { name: string; employees: string[]; dates: string[] }>();
      
      employees.forEach(emp => {
        emp.training.forEach(t => {
          const map = t.type === 'Training' ? trainingMap : certificationMap;
          
          if (!map.has(t.name)) {
            map.set(t.name, { name: t.name, employees: [], dates: [] });
          }
          
          const item = map.get(t.name)!;
          item.employees.push(emp.name);
          if (t.date) {
            item.dates.push(new Date(t.date).toLocaleDateString());
          }
        });
      });
      
      // Convert to arrays and sort by name
      const training = Array.from(trainingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      const certifications = Array.from(certificationMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      
      setTrainingData(training);
      setCertificationData(certifications);
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="training-certifications">
      <header className="training-header">
        <h1>Training & Certifications</h1>
        <button className="btn btn-primary" onClick={fetchTrainingData} disabled={loading}>
          {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </header>

      <div className="training-content">
        <div className="training-grid">
          {/* Training Courses */}
          <div className="training-column">
            <div className="column-header">
              <h2>Training Courses</h2>
              <span className="count-badge">{trainingData.length}</span>
            </div>
            {trainingData.length === 0 ? (
              <p className="empty-message">No training courses recorded</p>
            ) : (
              <div className="training-list">
                {trainingData.map((item, idx) => (
                  <div key={idx} className="training-item">
                    <div className="training-name">{item.name}</div>
                    <div className="training-employees">
                      {item.employees.map((emp: string, empIdx: number) => (
                        <span key={empIdx} className="employee-badge">
                          {emp}
                        </span>
                      ))}
                    </div>
                    <div className="training-count">
                      {item.employees.length} employee{item.employees.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="training-column">
            <div className="column-header">
              <h2>Certifications</h2>
              <span className="count-badge certification">{certificationData.length}</span>
            </div>
            {certificationData.length === 0 ? (
              <p className="empty-message">No certifications recorded</p>
            ) : (
              <div className="training-list">
                {certificationData.map((item, idx) => (
                  <div key={idx} className="training-item certification">
                    <div className="training-name">{item.name}</div>
                    <div className="training-employees">
                      {item.employees.map((emp: string, empIdx: number) => (
                        <span key={empIdx} className="employee-badge certification">
                          {emp}
                        </span>
                      ))}
                    </div>
                    <div className="training-count">
                      {item.employees.length} employee{item.employees.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
