import React, { useState, useEffect } from 'react';
import './WorkingHours.css';

interface WorkHourEntry {
  date: string;
  login: string | null;
  logout: string | null;
  totalMinutes: number;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  days: WorkHourEntry[];
}

export const WorkingHours: React.FC = () => {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWorkHours();
  }, []);

  useEffect(() => {
    // Expand the first week by default
    if (weeks.length > 0 && expandedWeeks.size === 0) {
      setExpandedWeeks(new Set([weeks[0].weekStart]));
    }
  }, [weeks]);

  const fetchWorkHours = async () => {
    setLoading(true);
    setError(null);
    try {
      // Run PowerShell script file
      const scriptPath = 'get-work-hours.ps1';
      console.log('Fetching work hours from:', scriptPath);
      const result = await window.electronAPI.runPowerShell(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`
      );
      console.log('PowerShell result:', result);

      const entries: WorkHourEntry[] = [];
      
      try {
        const trimmedResult = result.trim();
        if (!trimmedResult || trimmedResult === '[]') {
          setWeeks([]);
          setLoading(false);
          return;
        }

        const logs = JSON.parse(trimmedResult);
        const logsArray = Array.isArray(logs) ? logs : [logs];
        
        // Sort by time
        logsArray.sort((a: any, b: any) => new Date(a.Time).getTime() - new Date(b.Time).getTime());
        
        // Group by date and pair logons with logoffs
        const dateMap = new Map<string, { logons: Date[], logoffs: Date[] }>();
        
        logsArray.forEach((log: any) => {
          const date = new Date(log.Time);
          const dateStr = date.toISOString().split('T')[0];
          
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, { logons: [], logoffs: [] });
          }
          
          const dayData = dateMap.get(dateStr)!;
          if (log.Event === 'Logon') {
            dayData.logons.push(date);
          } else {
            dayData.logoffs.push(date);
          }
        });

        // Process each day - pair logons with logoffs
        dateMap.forEach((dayData, dateStr) => {
          let login: string | null = null;
          let logout: string | null = null;
          let totalMinutes = 0;

          // Sort logons and logoffs
          dayData.logons.sort((a, b) => a.getTime() - b.getTime());
          dayData.logoffs.sort((a, b) => a.getTime() - b.getTime());

          if (dayData.logons.length > 0) {
            const firstLogon = dayData.logons[0];
            login = firstLogon.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Find the last logoff that's after the first logon
            let lastLogoff: Date | null = null;
            for (let i = dayData.logoffs.length - 1; i >= 0; i--) {
              if (dayData.logoffs[i] > firstLogon) {
                lastLogoff = dayData.logoffs[i];
                break;
              }
            }

            if (lastLogoff) {
              logout = lastLogoff.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              totalMinutes = (lastLogoff.getTime() - firstLogon.getTime()) / 60000;
            } else {
              // No logoff today, calculate until now if it's today
              const today = new Date().toISOString().split('T')[0];
              if (dateStr === today) {
                totalMinutes = (new Date().getTime() - firstLogon.getTime()) / 60000;
              }
            }
          }

          entries.push({
            date: dateStr,
            login,
            logout,
            totalMinutes: Math.max(0, totalMinutes)
          });
        });
      } catch (parseErr) {
        console.error('Error parsing PowerShell output:', parseErr);
        console.error('Raw output:', result);
        setError('Failed to parse work hours data');
        setLoading(false);
        return;
      }

      // Organize into weeks (Monday-Sunday)
      const weekMap = new Map<string, WorkHourEntry[]>();
      entries.forEach(entry => {
        const date = new Date(entry.date + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(date.getFullYear(), date.getMonth(), diff);
        const weekKey = monday.toISOString().split('T')[0];
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, []);
        }
        weekMap.get(weekKey)!.push(entry);
      });

      const weeksArray: WeekData[] = Array.from(weekMap.entries())
        .map(([weekStart, days]) => {
          const endDate = new Date(weekStart + 'T00:00:00');
          endDate.setDate(endDate.getDate() + 6);
          return {
            weekStart,
            weekEnd: endDate.toISOString().split('T')[0],
            days: days.sort((a, b) => a.date.localeCompare(b.date))
          };
        })
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

      console.log('Entries:', entries);
      console.log('Weeks data:', weeksArray);
      setWeeks(weeksArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch work hours');
    } finally {
      setLoading(false);
    }
  };

  const getScriptPath = (): string => {
    return 'tasktracker/get-work-hours.ps1';
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const calculateNetHours = (totalMinutes: number): string => {
    // Subtract 30 min break (12:00 PM to 12:30 PM)
    const netMinutes = Math.max(0, totalMinutes - 30);
    const hours = Math.floor(netMinutes / 60);
    const mins = Math.round(netMinutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getWeekTotal = (days: WorkHourEntry[]): string => {
    const total = days.reduce((sum, entry) => sum + entry.totalMinutes, 0);
    return formatMinutes(total);
  };

  const copyWeekToClipboard = (week: WeekData) => {
    try {
      const lines: string[] = [];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      // Add Mon-Fri data (first 5 days) - only times, no headers or day names
      days.forEach((dayName, idx) => {
        const dayDate = new Date(week.weekStart + 'T00:00:00');
        dayDate.setDate(dayDate.getDate() + idx);
        const dateStr = dayDate.toISOString().split('T')[0];
        const entry = week.days.find(d => d.date === dateStr);
        
        // Remove AM/PM from times
        const login = entry?.login ? entry.login.replace(/\s(AM|PM)/i, '') : '-';
        const logout1 = '12:00';
        const login2 = '12:30';
        const logout2 = entry?.logout ? entry.logout.replace(/\s(AM|PM)/i, '') : '-';
        
        lines.push(`${login}\t${logout1}\t${login2}\t${logout2}`);
      });
      
      const text = lines.join('\n');
      navigator.clipboard.writeText(text).then(() => {
        alert('Mon-Fri times copied to clipboard!');
      }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy to clipboard');
      });
    } catch (err) {
      console.error('Error in copyWeekToClipboard:', err);
      alert('Error copying data');
    }
  };

  const toggleWeekExpanded = (weekStart: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekStart)) {
      newExpanded.delete(weekStart);
    } else {
      newExpanded.add(weekStart);
    }
    setExpandedWeeks(newExpanded);
  };

  const getMonFriTotal = (days: WorkHourEntry[]): string => {
    const total = days.slice(0, 5).reduce((sum, entry) => sum + entry.totalMinutes, 0);
    return formatMinutes(total);
  };

  return (
    <div className="working-hours">
      <header className="hours-header">
        <h1>Working Hours</h1>
        <button className="btn btn-primary" onClick={fetchWorkHours} disabled={loading}>
          {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </header>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="weeks-container">
        {weeks.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            {loading ? 'Loading...' : 'No work hours data available. Click Refresh to load data.'}
          </div>
        ) : (
          weeks.map((week) => {
            const startDate = new Date(week.weekStart + 'T00:00:00');
            const endDate = new Date(week.weekEnd + 'T00:00:00');
            const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            const isExpanded = expandedWeeks.has(week.weekStart);
            
            return (
              <div key={week.weekStart} className="week-card">
                <div 
                  className="week-header"
                  onClick={() => toggleWeekExpanded(week.weekStart)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{isExpanded ? '▼' : '▶'} {weekLabel}</h3>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyWeekToClipboard(week);
                    }}
                    title="Copy Mon-Fri data to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>

                <table className="week-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Login</th>
                      <th>Logout</th>
                      <th>Login</th>
                      <th>Logout</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const maxIdx = isExpanded ? 7 : 5;
                      
                      return days.slice(0, maxIdx).map((dayName, idx) => {
                        const dayDate = new Date(week.weekStart + 'T00:00:00');
                        dayDate.setDate(dayDate.getDate() + idx);
                        const dateStr = dayDate.toISOString().split('T')[0];
                        const entry = week.days.find(d => d.date === dateStr);
                        
                        return (
                          <tr key={`${week.weekStart}-${idx}`} className={entry?.login ? '' : 'no-data'}>
                            <td className="day-cell">{dayName.substring(0, 3)}</td>
                            <td className="time-cell">{entry?.login || '-'}</td>
                            <td className="time-cell">12:00</td>
                            <td className="time-cell">12:30</td>
                            <td className="time-cell">{entry?.logout || '-'}</td>
                            <td className="hours-cell">
                              {entry?.login ? calculateNetHours(entry.totalMinutes) : '-'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>

                <div className="week-footer">
                  <span className="week-total">
                    Total (Mon-Fri): {getMonFriTotal(week.days)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
