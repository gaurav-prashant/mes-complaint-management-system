import React, { useState, useEffect } from 'react';

export default function SuperAdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE}/complaints`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success) {
          setComplaints(data.complaints || []);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c?.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c?.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c?.status === 'Resolved').length;

  return (
    <div className="super-admin-dashboard-container">
      <div className="super-admin-dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p>System Administration & Overview</p>
      </div>
      
      {isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div className="super-admin-metric-grid">
          <div className="super-admin-metric-card">
            <h3>Total Complaints</h3>
            <div className="super-metric-value">{totalComplaints}</div>
          </div>
          
          <div className="super-admin-metric-card">
            <h3>Pending Complaints</h3>
            <div className="super-metric-value text-yellow">{pendingCount}</div>
          </div>
          
          <div className="super-admin-metric-card">
            <h3>In Progress</h3>
            <div className="super-metric-value text-blue">{inProgressCount}</div>
          </div>
          
          <div className="super-admin-metric-card">
            <h3>Resolved</h3>
            <div className="super-metric-value text-green">{resolvedCount}</div>
          </div>
        </div>
      )}

      <div className="super-admin-system-overview">
        <h2>System Overview</h2>
        <p>Dashboard is now connected to live MongoDB data.</p>
      </div>
    </div>
  );
}
