import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// ─── Icons Helper ─────────────────────────────────────────────────────────────

const icons = {
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  )
};

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Submitted:   { cls: 'badge-submitted',   dot: '#64748b' },
  Pending:     { cls: 'badge-pending',     dot: '#f97316' },
  'In Progress': { cls: 'badge-inprogress', dot: '#3b82f6' },
  Resolved:    { cls: 'badge-resolved',    dot: '#10b981' },
  Rejected:    { cls: 'badge-rejected',    dot: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Submitted'];
  return (
    <span className={`sadm-badge ${cfg.cls}`}>
      <span className="sadm-badge-dot" style={{ background: cfg.dot }} />
      {status || 'Submitted'}
    </span>
  );
}

// ─── Chart Styling ────────────────────────────────────────────────────────────

const PIE_COLORS = {
  Submitted:    '#64748b',
  Pending:      '#f97316',
  'In Progress':'#3b82f6',
  Resolved:     '#10b981',
  Rejected:     '#ef4444',
};
const BAR_COLOR = '#3b82f6';
const LINE_COLOR = '#6366f1';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="sadm-chart-tooltip">
      {label && <p className="sadm-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="sadm-tooltip-value" style={{ color: p.color || p.fill || '#1e293b' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search states
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter]     = useState('All Categories');
  const [sortBy, setSortBy]             = useState('newest');

  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus]               = useState('');
  const [editRemarks, setEditRemarks]             = useState('');
  const [notification, setNotification]           = useState('');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget]           = useState(null);
  const [isDeleting, setIsDeleting]               = useState(false);

  // ── Fetch Complaints ──────────────────────────────────────────────────────────

  const fetchComplaints = async () => {
    setIsLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${API_BASE}/complaints`, { signal: controller.signal });
      clearTimeout(timeoutId);
      let data;
      try { data = await response.json(); } catch { throw new Error('Invalid JSON response from server'); }
      if (!response.ok || !data.success) throw new Error(data?.message || 'Failed to fetch complaints');
      setComplaints(data.complaints || []);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(err);
      setError(err.name === 'AbortError' ? 'Unable to connect to database. Request timed out.' : (err.message || 'Unable to load complaints. Please check server connection.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    navigate('/super-admin/login');
  };

  // ── Modal Handlers ───────────────────────────────────────────────────────────

  const openModal = (complaint) => {
    setSelectedComplaint(complaint);
    setEditStatus(complaint.status || 'Submitted');
    setEditRemarks(complaint.admin_remarks || complaint.remarks || '');
    setNotification('');
  };
  const closeModal = () => setSelectedComplaint(null);

  const saveChanges = async () => {
    if (!selectedComplaint) return;
    const targetId = selectedComplaint._id || selectedComplaint.complaintId;
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${API_BASE}/complaints/${targetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, admin_remarks: editRemarks }),
      });
      let resData;
      try { resData = await response.json(); } catch { throw new Error('Failed to parse update response'); }
      if (!response.ok || !resData.success) throw new Error(resData?.message || 'Update failed');

      setNotification('Complaint updated successfully in MongoDB Atlas.');
      setComplaints(prev => prev.map(c => {
        if ((c._id && c._id === targetId) || (c.complaintId && c.complaintId === targetId))
          return { ...c, status: editStatus, admin_remarks: editRemarks, updated_at: new Date().toISOString() };
        return c;
      }));
      setSelectedComplaint(prev => ({ ...prev, status: editStatus, admin_remarks: editRemarks, updated_at: new Date().toISOString() }));
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update complaint.');
    }
  };

  // ── Delete Complaint Handler ─────────────────────────────────────────────────

  const confirmDelete = (complaint) => {
    setDeleteTarget(complaint);
  };
  const cancelDelete = () => setDeleteTarget(null);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id || deleteTarget.complaintId;
    setIsDeleting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${API_BASE}/complaints/${targetId}`, {
        method: 'DELETE',
      });
      let resData;
      try { resData = await response.json(); } catch { throw new Error('Failed to parse delete response'); }
      if (!response.ok || !resData.success) throw new Error(resData?.message || 'Deletion failed');

      setComplaints(prev => prev.filter(c => (c._id !== targetId && c.complaintId !== targetId)));
      setDeleteTarget(null);
      if (selectedComplaint && (selectedComplaint._id === targetId || selectedComplaint.complaintId === targetId)) {
        closeModal();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete complaint from MongoDB.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── KPI Calculations (Real MongoDB Data) ─────────────────────────────────────

  const totalComplaints  = complaints.length;
  const submittedCount   = complaints.filter(c => c?.status === 'Submitted').length;
  const pendingCount     = complaints.filter(c => c?.status === 'Pending').length;
  const inProgressCount  = complaints.filter(c => c?.status === 'In Progress').length;
  const resolvedCount    = complaints.filter(c => c?.status === 'Resolved').length;
  const rejectedCount    = complaints.filter(c => c?.status === 'Rejected').length;

  // ── Dynamic Categories ───────────────────────────────────────────────────────

  const uniqueCategories = useMemo(() => [
    ...new Set(complaints.map(c => {
      const raw = c?.complaint_type || c?.type || c?.complaintType || '';
      return String(raw).split('/')[0].trim();
    }).filter(Boolean))
  ], [complaints]);

  // ── Filtered & Sorted Complaints ─────────────────────────────────────────────

  const filteredComplaints = useMemo(() => {
    let result = complaints.filter(c => {
      if (!c) return false;
      const cId     = String(c.complaintId || c._id || '').toLowerCase();
      const cName   = String(c.name || c.fullName || '').toLowerCase();
      const cEmail  = String(c.email || '').toLowerCase();
      const cMobile = String(c.mobile || '').toLowerCase();
      const cLoc    = String(c.location || '').toLowerCase();
      const sl      = searchTerm.toLowerCase();

      const matchesSearch = cId.includes(sl) || cName.includes(sl) || cEmail.includes(sl) || cMobile.includes(sl) || cLoc.includes(sl);
      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
      const rawType       = c.complaint_type || c.type || c.complaintType || '';
      const cleanType     = String(rawType).split('/')[0].trim();
      const matchesType   = typeFilter === 'All Categories' || cleanType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.submittedAt || 0).getTime();
      const dateB = new Date(b.created_at || b.submittedAt || 0).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [complaints, searchTerm, statusFilter, typeFilter, sortBy]);

  // ── Analytics Datasets ───────────────────────────────────────────────────────

  // 1. Status Donut Chart
  const statusData = useMemo(() => [
    { name: 'Submitted',   value: submittedCount,  fill: PIE_COLORS['Submitted'] },
    { name: 'Pending',     value: pendingCount,     fill: PIE_COLORS['Pending'] },
    { name: 'In Progress', value: inProgressCount,  fill: PIE_COLORS['In Progress'] },
    { name: 'Resolved',    value: resolvedCount,    fill: PIE_COLORS['Resolved'] },
    { name: 'Rejected',    value: rejectedCount,    fill: PIE_COLORS['Rejected'] },
  ].filter(d => d.value > 0), [submittedCount, pendingCount, inProgressCount, resolvedCount, rejectedCount]);

  // 2. Category Bar Chart
  const categoryData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const t = String(c.complaint_type || c.type || c.complaintType || 'Other').split('/')[0].trim();
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [complaints]);

  // 3. Trend Area Chart (Parsed from real created_at dates)
  const trendData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const raw = c.created_at || c.submittedAt || c.submittedDate || '';
      if (!raw) return;
      let dateStr = '';
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 10);
        } else {
          dateStr = String(raw).slice(0, 10);
        }
      } catch { dateStr = String(raw).slice(0, 10); }
      if (dateStr) map[dateStr] = (map[dateStr] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({
        date: date.slice(5),
        count,
        fullDate: date,
      }));
  }, [complaints]);

  // ── Helper Formatter ─────────────────────────────────────────────────────────

  const formatDate = (raw) => {
    if (!raw) return 'N/A';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return String(raw); }
  };

  // ── KPI Cards Data ───────────────────────────────────────────────────────────

  const kpiCards = [
    { label: 'Total Complaints', value: totalComplaints, cls: 'kpi-total',      bg: 'linear-gradient(135deg,#0f172a,#1e3a5f)', icon: icons.list,       textColor: '#0f172a' },
    { label: 'Submitted',        value: submittedCount,  cls: 'kpi-submitted',  bg: 'linear-gradient(135deg,#475569,#64748b)', icon: icons.calendar,   textColor: '#475569' },
    { label: 'Pending',          value: pendingCount,    cls: 'kpi-pending',    bg: 'linear-gradient(135deg,#f97316,#fb923c)', icon: icons.clock,      textColor: '#c2410c' },
    { label: 'In Progress',      value: inProgressCount, cls: 'kpi-progress',   bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)', icon: icons.shield,     textColor: '#1d4ed8' },
    { label: 'Resolved',         value: resolvedCount,   cls: 'kpi-resolved',   bg: 'linear-gradient(135deg,#10b981,#34d399)', icon: icons.check,      textColor: '#15803d' },
    { label: 'Rejected',         value: rejectedCount,   cls: 'kpi-rejected',   bg: 'linear-gradient(135deg,#ef4444,#f87171)', icon: icons.xCircle,    textColor: '#b91c1c' },
  ];

  // System Health state
  const sysStatus = error ? 'offline' : isLoading ? 'connecting' : 'online';

  return (
    <div className="sadm-page">

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="sadm-header">
        <div className="sadm-header-left">
          <div className="sadm-header-icon-wrap">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {icons.shield}
            </svg>
          </div>
          <div>
            <div className="sadm-header-badge">Super Admin Command Center</div>
            <h1 className="sadm-heading">MES Operations &amp; Administration Panel</h1>
            <p className="sadm-subheading">System-wide complaint monitoring, database verification &amp; status resolution</p>
          </div>
        </div>

        <div className="sadm-header-right">
          <div className={`sadm-sys-pill sadm-sys-${sysStatus}`}>
            <span className={`sadm-sys-dot ${sysStatus === 'online' ? 'pulse' : ''}`} />
            {sysStatus === 'online' ? 'MongoDB Atlas Online' : sysStatus === 'connecting' ? 'Connecting API...' : 'System Error'}
          </div>

          <button className="sadm-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* ══ MAIN BODY ════════════════════════════════════════════════════════ */}
      <main className="sadm-body">

        {/* Loading State */}
        {isLoading ? (
          <div className="sadm-state-card">
            <div className="sadm-spinner" />
            <h3 className="sadm-state-title">Loading Administrative Panel</h3>
            <p className="sadm-state-sub">Fetching live complaints data from MongoDB Atlas database…</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="sadm-state-card sadm-state-error">
            <div className="sadm-error-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {icons.xCircle}
              </svg>
            </div>
            <h3 className="sadm-state-title sadm-error-title">Database Connection Error</h3>
            <p className="sadm-state-sub">{error}</p>
            <button className="sadm-retry-btn" onClick={fetchComplaints}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Retry Database Connection
            </button>
          </div>
        ) : (
          <>
            {/* ══ KPI METRICS GRID ═══════════════════════════════════════════ */}
            <section className="sadm-kpi-grid">
              {kpiCards.map(card => (
                <div key={card.label} className={`sadm-kpi-card ${card.cls}`}>
                  <div className="sadm-kpi-icon-wrap" style={{ background: card.bg }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {card.icon}
                    </svg>
                  </div>
                  <div className="sadm-kpi-info">
                    <p className="sadm-kpi-label">{card.label}</p>
                    <p className="sadm-kpi-value" style={{ color: card.textColor }}>{card.value}</p>
                  </div>
                  <div className="sadm-kpi-bg-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: card.textColor }}>
                      {card.icon}
                    </svg>
                  </div>
                </div>
              ))}
            </section>

            {/* ══ QUICK ACTION FILTERS ═══════════════════════════════════════ */}
            <section className="sadm-quick-actions">
              <div className="sadm-qa-label">Quick Filters &amp; Controls</div>
              <div className="sadm-qa-buttons">
                {[
                  { label: 'View Pending',     status: 'Pending',     color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
                  { label: 'View In Progress', status: 'In Progress', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
                  { label: 'View Resolved',    status: 'Resolved',    color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
                  { label: 'View Rejected',    status: 'Rejected',    color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
                ].map(btn => (
                  <button
                    key={btn.status}
                    className={`sadm-qa-btn ${statusFilter === btn.status ? 'sadm-qa-active' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === btn.status ? 'All Status' : btn.status)}
                    style={statusFilter === btn.status ? { background: btn.bg, color: btn.color, borderColor: btn.border } : {}}
                  >
                    <span className="sadm-qa-dot" style={{ background: btn.color }} />
                    {btn.label}
                  </button>
                ))}
                <button className="sadm-qa-btn sadm-qa-refresh" onClick={fetchComplaints}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh Live Data
                </button>
                {(statusFilter !== 'All Status' || typeFilter !== 'All Categories' || searchTerm) && (
                  <button className="sadm-qa-btn sadm-qa-clear" onClick={() => { setStatusFilter('All Status'); setTypeFilter('All Categories'); setSearchTerm(''); }}>
                    ✕ Clear Filters
                  </button>
                )}
              </div>
            </section>

            {/* ══ COMPLAINTS MANAGEMENT GRID ════════════════════════════════ */}
            <section className="sadm-section-card">
              <div className="sadm-section-head">
                <div className="sadm-section-title-group">
                  <div className="sadm-section-icon icon-blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {icons.list}
                    </svg>
                  </div>
                  <div>
                    <h2 className="sadm-section-h2">Complaint Management Directory</h2>
                    <p className="sadm-section-meta">
                      Showing {filteredComplaints.length} of {totalComplaints} complaints from MongoDB Atlas
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="sadm-filters">
                <div className="sadm-search-wrap">
                  <svg className="sadm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by ID, name, email, mobile or location…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="sadm-search-input"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="sadm-filter-select"
                >
                  <option value="All Status">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="sadm-filter-select"
                >
                  <option value="All Categories">All Categories</option>
                  {uniqueCategories.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="sadm-filter-select"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>
              </div>

              {/* Table */}
              <div className="sadm-table-wrap">
                <table className="sadm-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Complainant Name</th>
                      <th>Contact (Mobile/Email)</th>
                      <th>Category</th>
                      <th>Location / Quarter</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.length > 0 ? (
                      filteredComplaints.map((c, rowIdx) => {
                        const displayId       = c.complaintId || c._id;
                        const displayName     = c.name || c.fullName || 'N/A';
                        const displayMobile   = c.mobile || 'N/A';
                        const displayEmail    = c.email || '';
                        const displayType     = String(c.complaint_type || c.type || c.complaintType || '').split('/')[0].trim() || 'N/A';
                        const displayLocation = c.location || 'N/A';
                        const displayQuarter  = c.quarter || 'N/A';
                        const displayDate     = formatDate(c.created_at || c.submittedAt || c.submittedDate);

                        return (
                          <tr key={displayId} className={rowIdx % 2 === 1 ? 'sadm-tr-alt' : ''}>
                            <td className="sadm-td-id">#{String(displayId).slice(-8).toUpperCase()}</td>
                            <td className="sadm-td-name">
                              <div className="sadm-name-bold">{displayName}</div>
                            </td>
                            <td>
                              <div className="sadm-contact-cell">
                                <span>{displayMobile}</span>
                                {displayEmail && <span className="sadm-email-sub">{displayEmail}</span>}
                              </div>
                            </td>
                            <td>
                              <span className="sadm-type-pill">{displayType}</span>
                            </td>
                            <td>
                              <div className="sadm-location-cell">
                                <span>{displayLocation}</span>
                                {displayQuarter !== 'N/A' && <span className="sadm-quarter-sub">Qtr: {displayQuarter}</span>}
                              </div>
                            </td>
                            <td><StatusBadge status={c.status} /></td>
                            <td className="sadm-td-date">{displayDate}</td>
                            <td>
                              <div className="sadm-action-btns">
                                <button className="sadm-view-btn" onClick={() => openModal(c)} title="View Details & Update Status">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {icons.eye}
                                  </svg>
                                  View
                                </button>
                                <button className="sadm-delete-btn" onClick={() => confirmDelete(c)} title="Delete Complaint from MongoDB">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {icons.trash}
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="sadm-table-empty">
                          <div className="sadm-empty-state">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <p>{complaints.length === 0 ? 'No complaints found in MongoDB database.' : 'No complaints match the current search/filter criteria.'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ══ ANALYTICS OVERVIEW SECTION ════════════════════════════════ */}
            {complaints.length > 0 && (
              <section className="sadm-analytics-section">
                <div className="sadm-section-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <div className="sadm-section-title-group">
                    <div className="sadm-section-icon icon-purple">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="sadm-section-h2">System Analytics &amp; Visual Intelligence</h2>
                      <p className="sadm-section-meta">Live metrics calculated directly from MongoDB complaints dataset</p>
                    </div>
                  </div>
                </div>

                <div className="sadm-analytics-grid">
                  {/* Chart 1 — Status Donut */}
                  <div className="sadm-chart-card">
                    <h3 className="sadm-chart-title">
                      <span className="sadm-chart-title-dot" style={{ background: '#6366f1' }} />
                      Status Distribution
                    </h3>
                    <div className="sadm-chart-body">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2 — Category Bar */}
                  <div className="sadm-chart-card">
                    <h3 className="sadm-chart-title">
                      <span className="sadm-chart-title-dot" style={{ background: '#3b82f6' }} />
                      Top Complaint Categories
                    </h3>
                    <div className="sadm-chart-body">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="value" name="Complaints" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3 — Recent Trend Line/Area */}
                  <div className="sadm-chart-card">
                    <h3 className="sadm-chart-title">
                      <span className="sadm-chart-title-dot" style={{ background: '#10b981' }} />
                      Recent Complaint Submission Trend
                    </h3>
                    {trendData.length >= 1 ? (
                      <div className="sadm-chart-body">
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="sadmTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0' }} />
                            <Area
                              type="monotone"
                              dataKey="count"
                              name="Complaints"
                              stroke={LINE_COLOR}
                              strokeWidth={2.5}
                              fill="url(#sadmTrendGrad)"
                              dot={{ r: 4, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="sadm-chart-no-data">
                        <p>Insufficient timestamp data for trend visualization.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ══ ADMIN MANAGEMENT OVERVIEW ═════════════════════════════════ */}
            <section className="sadm-section-card" style={{ marginBottom: 40 }}>
              <div className="sadm-section-head">
                <div className="sadm-section-title-group">
                  <div className="sadm-section-icon icon-green">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {icons.users}
                    </svg>
                  </div>
                  <div>
                    <h2 className="sadm-section-h2">Administrative Users &amp; Security Controls</h2>
                    <p className="sadm-section-meta">System Administrators &amp; Privileged Access Control List</p>
                  </div>
                </div>
              </div>

              <div className="sadm-admin-grid">
                <div className="sadm-admin-card">
                  <div className="sadm-admin-avatar">
                    <span>SA</span>
                  </div>
                  <div className="sadm-admin-info">
                    <div className="sadm-admin-role-tag role-super">Super Admin</div>
                    <h4 className="sadm-admin-name">Super Administrator</h4>
                    <p className="sadm-admin-email">superadmin@example.com</p>
                    <div className="sadm-admin-meta-list">
                      <span>✓ Full System Access</span>
                      <span>✓ Complaint Delete Privilege</span>
                      <span>✓ Database Read/Write</span>
                    </div>
                  </div>
                </div>

                <div className="sadm-admin-card">
                  <div className="sadm-admin-avatar avatar-blue">
                    <span>AD</span>
                  </div>
                  <div className="sadm-admin-info">
                    <div className="sadm-admin-role-tag role-admin">Operations Admin</div>
                    <h4 className="sadm-admin-name">MES Operations Admin</h4>
                    <p className="sadm-admin-email">admin@mes.com</p>
                    <div className="sadm-admin-meta-list">
                      <span>✓ Status Verification</span>
                      <span>✓ Admin Remarks Update</span>
                      <span>✓ Live Complaints Read</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ══ COMPLAINT DETAILS & EDIT MODAL ═══════════════════════════════════ */}
      {selectedComplaint && (
        <div className="sadm-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="sadm-modal">
            <div className="sadm-modal-head">
              <div className="sadm-modal-title-group">
                <div className="sadm-modal-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="sadm-modal-h2">Super Admin Complaint Review</h2>
                  <p className="sadm-modal-sub">MongoDB ID: {selectedComplaint._id} | Ref: {selectedComplaint.complaintId || selectedComplaint._id}</p>
                </div>
              </div>
              <button className="sadm-modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="sadm-modal-body">
              {notification && (
                <div className="sadm-notification-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icons.check}
                  </svg>
                  {notification}
                </div>
              )}

              <div className="sadm-detail-grid">
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Complaint ID</span>
                  <span className="sadm-detail-value">{selectedComplaint.complaintId || selectedComplaint._id}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Current Status</span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Complainant Name</span>
                  <span className="sadm-detail-value">{selectedComplaint.name || selectedComplaint.fullName || 'N/A'}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Mobile Number</span>
                  <span className="sadm-detail-value">{selectedComplaint.mobile || 'N/A'}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Email Address</span>
                  <span className="sadm-detail-value">{selectedComplaint.email || 'N/A'}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Location / Area</span>
                  <span className="sadm-detail-value">{selectedComplaint.location || 'N/A'}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Quarter Number</span>
                  <span className="sadm-detail-value">{selectedComplaint.quarter || 'N/A'}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Category / Type</span>
                  <span className="sadm-detail-value">{selectedComplaint.complaint_type || selectedComplaint.type || selectedComplaint.complaintType || 'N/A'}</span>
                </div>
                <div className="sadm-detail-item">
                  <span className="sadm-detail-label">Submitted Date</span>
                  <span className="sadm-detail-value">{formatDate(selectedComplaint.created_at || selectedComplaint.submittedAt || selectedComplaint.submittedDate)}</span>
                </div>
                {selectedComplaint.updated_at && (
                  <div className="sadm-detail-item">
                    <span className="sadm-detail-label">Last Updated</span>
                    <span className="sadm-detail-value">{formatDate(selectedComplaint.updated_at)}</span>
                  </div>
                )}
                <div className="sadm-detail-item sadm-detail-full">
                  <span className="sadm-detail-label">Description of Issue</span>
                  <div className="sadm-desc-box">{selectedComplaint.description || 'N/A'}</div>
                </div>

                {selectedComplaint.images && Array.isArray(selectedComplaint.images) && selectedComplaint.images.length > 0 && (
                  <div className="sadm-detail-item sadm-detail-full">
                    <span className="sadm-detail-label">Uploaded Attachments</span>
                    <div className="sadm-images-wrap">
                      {selectedComplaint.images.map((img, idx) =>
                        img ? (
                          <img
                            key={idx}
                            src={`data:image/jpeg;base64,${img}`}
                            alt={`Attachment ${idx + 1}`}
                            className="sadm-attach-img"
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Panel */}
              <div className="sadm-action-panel">
                <h3 className="sadm-action-panel-title">Update Status &amp; Admin Remarks</h3>
                <div className="sadm-action-form">
                  <div className="sadm-input-group">
                    <label className="sadm-input-label">Update Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="sadm-select"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="sadm-input-group sadm-input-full">
                    <label className="sadm-input-label">Super Admin Remarks</label>
                    <textarea
                      value={editRemarks}
                      onChange={e => setEditRemarks(e.target.value)}
                      placeholder="Enter official resolution notes or admin remarks here…"
                      className="sadm-textarea"
                    />
                  </div>

                  <button className="sadm-save-btn" onClick={saveChanges}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" />
                    </svg>
                    Save Changes to MongoDB
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRMATION MODAL ═══════════════════════════════════════ */}
      {deleteTarget && (
        <div className="sadm-modal-overlay" onClick={cancelDelete}>
          <div className="sadm-modal sadm-delete-modal">
            <div className="sadm-modal-head sadm-delete-head">
              <div className="sadm-modal-title-group">
                <div className="sadm-modal-icon sadm-delete-icon-bg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icons.trash}
                  </svg>
                </div>
                <div>
                  <h2 className="sadm-modal-h2" style={{ color: '#b91c1c' }}>Confirm Complaint Deletion</h2>
                  <p className="sadm-modal-sub">Permanent MongoDB Database Action</p>
                </div>
              </div>
              <button className="sadm-modal-close-btn" onClick={cancelDelete}>✕</button>
            </div>

            <div className="sadm-modal-body">
              <div className="sadm-delete-confirm-box">
                <p>Are you sure you want to permanently delete this complaint from MongoDB Atlas?</p>
                <div className="sadm-delete-details-card">
                  <p><strong>Complaint ID:</strong> {deleteTarget.complaintId || deleteTarget._id}</p>
                  <p><strong>Complainant Name:</strong> {deleteTarget.name || deleteTarget.fullName || 'N/A'}</p>
                  <p><strong>Category:</strong> {deleteTarget.complaint_type || deleteTarget.type || 'N/A'}</p>
                </div>
                <p className="sadm-delete-warning">⚠️ This operation cannot be undone. The complaint record will be permanently removed from the database.</p>
              </div>

              <div className="sadm-delete-actions">
                <button className="sadm-btn-cancel" onClick={cancelDelete} disabled={isDeleting}>
                  Cancel
                </button>
                <button className="sadm-btn-delete-confirm" onClick={executeDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting from MongoDB...' : 'Permanently Delete Complaint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
