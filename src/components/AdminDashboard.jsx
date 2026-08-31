import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import getApiBase from '../utils/apiBase';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts';

// ─── Icon Components ──────────────────────────────────────────────────────────

const Icon = ({ d, size = 20, stroke = 'currentColor', fill = 'none', strokeWidth = 2, viewBox = '0 0 24 24', style = {} }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const icons = {
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </>
  ),
  spinner: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" />
    </>
  ),
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  alertCircle: (
    <>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  trending: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </>
  ),
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  barChart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  wifi: (
    <>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Submitted: { cls: 'badge-submitted', dot: '#64748b' },
  Pending: { cls: 'badge-pending', dot: '#f97316' },
  'In Progress': { cls: 'badge-inprogress', dot: '#3b82f6' },
  Resolved: { cls: 'badge-resolved', dot: '#10b981' },
  Rejected: { cls: 'badge-rejected', dot: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Submitted'];
  return (
    <span className={`adm-badge ${cfg.cls}`}>
      <span className="adm-badge-dot" style={{ background: cfg.dot }} />
      {status || 'Submitted'}
    </span>
  );
}

// ─── Chart Colors ─────────────────────────────────────────────────────────────

const PIE_COLORS = {
  Submitted: '#64748b',
  Pending: '#f97316',
  'In Progress': '#3b82f6',
  Resolved: '#10b981',
  Rejected: '#ef4444',
};
const BAR_COLOR = '#3b82f6';
const LINE_COLOR = '#6366f1';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="adm-chart-tooltip">
      {label && <p className="adm-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="adm-tooltip-value" style={{ color: p.color || p.fill || '#1e293b' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [notification, setNotification] = useState('');

  // ── Account Settings state ───────────────────────────────────────────────────
  const [adminEmail, setAdminEmail]     = useState('');
  const [acctModalOpen, setAcctModalOpen] = useState(false);
  const [acctView, setAcctView]         = useState('main'); // 'main' | 'email' | 'password'

  // Change Email form state
  const [ceNewEmail, setCeNewEmail]     = useState('');
  const [ceCurrentPwd, setCeCurrentPwd] = useState('');
  const [ceError, setCeError]           = useState('');
  const [ceSuccess, setCeSuccess]       = useState('');
  const [ceLoading, setCeLoading]       = useState(false);

  // Change Password form state
  const [cpCurrentPwd, setCpCurrentPwd] = useState('');
  const [cpNewPwd, setCpNewPwd]         = useState('');
  const [cpConfirmPwd, setCpConfirmPwd] = useState('');
  const [cpError, setCpError]           = useState('');
  const [cpSuccess, setCpSuccess]       = useState('');
  const [cpLoading, setCpLoading]       = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────


  const fetchComplaints = async () => {
    setIsLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/complaints`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      clearTimeout(timeoutId);
      if (response.status === 401) {
        // Session expired or token invalid — force re-login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminAuthenticated');
        navigate('/admin/login', { replace: true });
        return;
      }
      let data;
      try { data = await response.json(); } catch { throw new Error('Invalid JSON response from server'); }
      if (!response.ok || !data.success) throw new Error(data?.message || 'Failed to fetch data');
      setComplaints(data.complaints || []);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(err);
      setError(err.name === 'AbortError' ? 'Unable to connect to the complaint database.' : (err.message || 'Unable to load complaints. Please check the server connection.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auth Guard — token-based ────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    // No token at all → redirect immediately
    if (!token) {
      localStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminToken');
      navigate('/admin/login', { replace: true });
      return;
    }

    // Client-side expiry check (decode payload only — NOT used as proof of auth)
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          // Token is expired — clear everything and redirect
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminAuthenticated');
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminAuthenticated');
          navigate('/admin/login', { replace: true });
          return;
        }
      }
    } catch {
      // Malformed token — treat as missing
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminAuthenticated');
      navigate('/admin/login', { replace: true });
      return;
    }

    fetchComplaints();
    fetchAdminProfile();
  }, [navigate]);

  // ── Logout ───────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

  // ── Fetch Admin Profile ───────────────────────────────────────────────────────

  const fetchAdminProfile = async () => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const response = await fetch(`${API_BASE}/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      if (data.success && data.admin) {
        setAdminEmail(data.admin.email);
      }
    } catch (err) {
      console.error('[Profile]', err.message);
    }
  };

  // ── Change Email ──────────────────────────────────────────────────────────────

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setCeError('');
    setCeSuccess('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!ceNewEmail || !emailRegex.test(ceNewEmail)) {
      setCeError('Please enter a valid new email address');
      return;
    }
    if (!ceCurrentPwd) {
      setCeError('Current password is required');
      return;
    }

    setCeLoading(true);
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/change-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: ceNewEmail, currentPassword: ceCurrentPwd }),
      });
      const data = await response.json();

      if (response.status === 401 && !data.success && data.message === 'Current password is incorrect') {
        setCeError('Current password is incorrect');
        return;
      }
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.status === 409) {
        setCeError(data.message || 'Email is already in use');
        return;
      }
      if (!data.success) {
        setCeError(data.message || 'Failed to update email');
        return;
      }

      // Session is invalidated — clear session immediately and redirect to login
      setCeSuccess('Email updated successfully! Redirecting to login…');
      setCeNewEmail('');
      setCeCurrentPwd('');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminAuthenticated');
      setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 1500);
    } catch (err) {
      setCeError('Failed to update email. Please try again.');
    } finally {
      setCeLoading(false);
    }
  };

  // ── Change Password ───────────────────────────────────────────────────────────

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');

    if (!cpCurrentPwd) { setCpError('Current password is required'); return; }
    if (!cpNewPwd)      { setCpError('New password is required'); return; }
    if (cpNewPwd.length < 8) { setCpError('New password must be at least 8 characters'); return; }
    if (cpNewPwd !== cpConfirmPwd) { setCpError('Passwords do not match'); return; }

    setCpLoading(true);
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: cpCurrentPwd, newPassword: cpNewPwd }),
      });
      const data = await response.json();

      if (response.status === 401 && data.message === 'Current password is incorrect') {
        setCpError('Current password is incorrect');
        return;
      }
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!data.success) {
        setCpError(data.message || 'Failed to change password');
        return;
      }

      // Force re-login — clear token and redirect after a brief message
      setCpSuccess('Password changed successfully! Redirecting to login…');
      setCpCurrentPwd('');
      setCpNewPwd('');
      setCpConfirmPwd('');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminAuthenticated');
      setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 1500);
    } catch (err) {
      setCpError('Failed to change password. Please try again.');
    } finally {
      setCpLoading(false);
    }
  };


  // ── Modal ────────────────────────────────────────────────────────────────────

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
      const API_BASE = getApiBase();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/complaints/${targetId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: editStatus, admin_remarks: editRemarks }),
      });
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminAuthenticated');
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!response.ok) throw new Error('Update failed');
      setNotification('Complaint updated successfully.');
      setComplaints(prev => prev.map(c => {
        if ((c._id && c._id === targetId) || (c.complaintId && c.complaintId === targetId))
          return { ...c, status: editStatus, admin_remarks: editRemarks };
        return c;
      }));
      setSelectedComplaint(prev => ({ ...prev, status: editStatus, admin_remarks: editRemarks }));
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update complaint.');
    }
  };

  // ── KPI Calculations (from real complaints only) ──────────────────────────────

  const totalComplaints = complaints.length;
  const submittedCount = complaints.filter(c => c?.status === 'Submitted').length;
  const pendingCount = complaints.filter(c => c?.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c?.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c?.status === 'Resolved').length;
  const rejectedCount = complaints.filter(c => c?.status === 'Rejected').length;

  // ── Unique Types (dynamic) ────────────────────────────────────────────────────

  const uniqueTypes = useMemo(() => [
    ...new Set(complaints.map(c => {
      const raw = c?.complaint_type || c?.type || c?.complaintType || '';
      return String(raw).split('/')[0].trim();
    }).filter(Boolean))
  ], [complaints]);

  // ── Filtering ─────────────────────────────────────────────────────────────────

  const filteredComplaints = useMemo(() => complaints.filter(c => {
    if (!c) return false;
    const cId = String(c.complaintId || c._id || '').toLowerCase();
    const cName = String(c.name || c.fullName || '').toLowerCase();
    const cMobile = String(c.mobile || '').toLowerCase();
    const cLoc = String(c.location || '').toLowerCase();
    const sl = searchTerm.toLowerCase();
    const matchesSearch = cId.includes(sl) || cName.includes(sl) || cMobile.includes(sl) || cLoc.includes(sl);
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    const rawType = c.complaint_type || c.type || c.complaintType || '';
    const cleanType = String(rawType).split('/')[0].trim();
    const matchesType = typeFilter === 'All Types' || cleanType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }), [complaints, searchTerm, statusFilter, typeFilter]);

  // ── Analytics Data (all from real complaints) ─────────────────────────────────

  // 1. Pie – status distribution
  const statusData = useMemo(() => [
    { name: 'Submitted', value: submittedCount, fill: PIE_COLORS['Submitted'] },
    { name: 'Pending', value: pendingCount, fill: PIE_COLORS['Pending'] },
    { name: 'In Progress', value: inProgressCount, fill: PIE_COLORS['In Progress'] },
    { name: 'Resolved', value: resolvedCount, fill: PIE_COLORS['Resolved'] },
    { name: 'Rejected', value: rejectedCount, fill: PIE_COLORS['Rejected'] },
  ].filter(d => d.value > 0), [submittedCount, pendingCount, inProgressCount, resolvedCount, rejectedCount]);

  // 2. Bar – top complaint types
  const typeData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const t = String(c.complaint_type || c.type || c.complaintType || 'Unknown').split('/')[0].trim();
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [complaints]);

  // 3. Line – recent complaint trend (grouped by date from created_at field)
  const trendData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const raw = c.created_at || c.submittedAt || c.submittedDate || '';
      if (!raw) return;
      // Parse to a consistent date string (YYYY-MM-DD)
      let dateStr = '';
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 10); // "2026-08-14"
        } else {
          // If string is already formatted like "14/08/2026" or similar, try direct
          dateStr = String(raw).slice(0, 10);
        }
      } catch {
        dateStr = String(raw).slice(0, 10);
      }
      if (dateStr) map[dateStr] = (map[dateStr] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // last 14 unique dates
      .map(([date, count]) => ({
        date: date.slice(5), // show "MM-DD" for brevity
        count,
        fullDate: date,
      }));
  }, [complaints]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const formatDate = (raw) => {
    if (!raw) return 'N/A';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return String(raw); }
  };

  // ── KPI Card Config ───────────────────────────────────────────────────────────

  const kpiCards = [
    { label: 'Total Complaints', value: totalComplaints, cls: 'kpi-total', iconColor: '#1e3a5f', bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)', icon: icons.list, textColor: '#1e3a5f' },
    { label: 'Submitted', value: submittedCount, cls: 'kpi-submitted', iconColor: '#475569', bg: 'linear-gradient(135deg,#475569,#64748b)', icon: icons.calendar, textColor: '#475569' },
    { label: 'Pending', value: pendingCount, cls: 'kpi-pending', iconColor: '#c2410c', bg: 'linear-gradient(135deg,#f97316,#fb923c)', icon: icons.clock, textColor: '#c2410c' },
    { label: 'In Progress', value: inProgressCount, cls: 'kpi-progress', iconColor: '#1d4ed8', bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)', icon: icons.shield, textColor: '#1d4ed8' },
    { label: 'Resolved', value: resolvedCount, cls: 'kpi-resolved', iconColor: '#15803d', bg: 'linear-gradient(135deg,#10b981,#34d399)', icon: icons.check, textColor: '#15803d' },
    { label: 'Rejected', value: rejectedCount, cls: 'kpi-rejected', iconColor: '#b91c1c', bg: 'linear-gradient(135deg,#ef4444,#f87171)', icon: icons.xCircle, textColor: '#b91c1c' },
  ];

  // ── System Status ─────────────────────────────────────────────────────────────

  const sysStatus = error ? 'offline' : isLoading ? 'connecting' : 'online';
  const sysLabels = { online: 'System Online', connecting: 'Connecting...', offline: 'System Offline' };
  const sysDotColors = { online: '#10b981', connecting: '#f59e0b', offline: '#ef4444' };
  const sysBgColors = { online: 'rgba(16,185,129,0.1)', connecting: 'rgba(245,158,11,0.1)', offline: 'rgba(239,68,68,0.1)' };
  const sysTextColors = { online: '#065f46', connecting: '#92400e', offline: '#991b1b' };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="adm-page">

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="adm-header">
        <div className="adm-header-left">
          <div className="adm-header-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="adm-header-text">
            <h1 className="adm-heading">Complaint Operations Dashboard</h1>
            <p className="adm-subheading">Live Monitoring, Status Verification &amp; Resolution Management</p>
          </div>
        </div>
        <div className="adm-header-right">
          <div className="adm-status-badge" style={{ background: sysBgColors[sysStatus], color: sysTextColors[sysStatus] }}>
            <span className={`adm-status-dot ${sysStatus === 'online' ? 'pulse' : ''}`} style={{ background: sysDotColors[sysStatus] }} />
            {sysLabels[sysStatus]}
          </div>

          <button
            type="button"
            className="adm-header-settings-btn"
            onClick={() => { setAcctModalOpen(true); setAcctView('main'); setCeError(''); setCeSuccess(''); setCpError(''); setCpSuccess(''); }}
            aria-label="Account Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Account Settings</span>
          </button>

          <button
            type="button"
            className="adm-logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ══ BODY ═══════════════════════════════════════════════════════════ */}
      <main className="adm-body">

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="adm-state-card">
            <div className="adm-spinner-wrap">
              <div className="adm-spinner" />
            </div>
            <h3 className="adm-state-title">Loading Dashboard</h3>
            <p className="adm-state-sub">Fetching complaint data from the database…</p>
          </div>
        ) : error ? (

          /* ── Error ───────────────────────────────────────────────────── */
          <div className="adm-state-card adm-state-error">
            <div className="adm-state-icon-wrap adm-error-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="adm-state-title adm-error-title">Connection Error</h3>
            <p className="adm-state-sub">{error}</p>
            <button className="adm-retry-btn" onClick={fetchComplaints}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* ══ KPI CARDS ══════════════════════════════════════════════════ */}
            <section className="adm-kpi-grid">
              {kpiCards.map(card => (
                <div key={card.label} className={`adm-kpi-card ${card.cls}`}>
                  <div className="adm-kpi-icon-col">
                    <div className="adm-kpi-icon-wrap" style={{ background: card.bg }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {card.icon}
                      </svg>
                    </div>
                  </div>
                  <div className="adm-kpi-info">
                    <p className="adm-kpi-label">{card.label}</p>
                    <p className="adm-kpi-value" style={{ color: card.textColor }}>{card.value}</p>
                  </div>
                  <div className="adm-kpi-bg-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: card.textColor }}>
                      {card.icon}
                    </svg>
                  </div>
                </div>
              ))}
            </section>

            {/* ══ QUICK ACTIONS ══════════════════════════════════════════════ */}
            <section className="adm-quick-actions">
              <div className="adm-qa-label">Quick Filters</div>
              <div className="adm-qa-buttons">
                {[
                  { label: 'View Pending', status: 'Pending', color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
                  { label: 'View In Progress', status: 'In Progress', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
                  { label: 'View Resolved', status: 'Resolved', color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
                  { label: 'View Rejected', status: 'Rejected', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
                ].map(btn => (
                  <button
                    key={btn.status}
                    className={`adm-qa-btn ${statusFilter === btn.status ? 'adm-qa-active' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === btn.status ? 'All Status' : btn.status)}
                    style={statusFilter === btn.status ? { background: btn.bg, color: btn.color, borderColor: btn.border } : {}}
                  >
                    <span className="adm-qa-dot" style={{ background: btn.color }} />
                    {btn.label}
                  </button>
                ))}
                <button className="adm-qa-btn adm-qa-refresh" onClick={fetchComplaints}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh Data
                </button>
                {statusFilter !== 'All Status' && (
                  <button className="adm-qa-btn adm-qa-clear" onClick={() => setStatusFilter('All Status')}>
                    ✕ Clear Filter
                  </button>
                )}
              </div>
            </section>

            {/* ══ RECENT COMPLAINTS ══════════════════════════════════════════ */}
            <section className="adm-section-card">
              <div className="adm-section-head">
                <div className="adm-section-title-group">
                  <div className="adm-section-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="adm-section-h2">Recent Complaints</h2>
                    <p className="adm-section-meta">
                      Showing {filteredComplaints.length} of {totalComplaints} complaints
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="adm-filters">
                <div className="adm-search-wrap">
                  <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    id="adm-search-input"
                    type="text"
                    placeholder="Search by ID, mobile, name or location…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="adm-search-input"
                  />
                </div>
                <select
                  id="adm-status-filter"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="adm-filter-select"
                >
                  <option value="All Status">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  id="adm-type-filter"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="adm-filter-select"
                >
                  <option value="All Types">All Types</option>
                  {uniqueTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Complainant Name</th>
                      <th>Mobile Number</th>
                      <th>Complaint Type</th>
                      <th>Location</th>
                      <th>Quarter No.</th>
                      <th>Status</th>
                      <th>Submitted Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.length > 0 ? (
                      filteredComplaints.map((c, rowIdx) => {
                        const displayId = c.complaintId || c._id;
                        const displayName = c.name || c.fullName || 'N/A';
                        const displayMobile = c.mobile || 'N/A';
                        const displayType = String(c.complaint_type || c.type || c.complaintType || '').split('/')[0].trim() || 'N/A';
                        const displayLocation = c.location || 'N/A';
                        const displayQuarter = c.quarter || 'N/A';
                        const displayDate = formatDate(c.created_at || c.submittedAt || c.submittedDate);
                        return (
                          <tr key={displayId} className={rowIdx % 2 === 1 ? 'adm-tr-alt' : ''}>
                            <td className="adm-td-id">#{String(displayId).slice(-6).toUpperCase()}</td>
                            <td className="adm-td-name">{displayName}</td>
                            <td>{displayMobile}</td>
                            <td>
                              <span className="adm-type-pill">{displayType}</span>
                            </td>
                            <td>{displayLocation}</td>
                            <td>{displayQuarter}</td>
                            <td><StatusBadge status={c.status} /></td>
                            <td className="adm-td-date">{displayDate}</td>
                            <td>
                              <button className="adm-view-btn" onClick={() => openModal(c)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                </svg>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="adm-table-empty">
                          <div className="adm-empty-state">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <p>{complaints.length === 0 ? 'No complaints found in the database.' : 'No complaints match the current filters.'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ══ ANALYTICS ═════════════════════════════════════════════════ */}
            {complaints.length > 0 && (
              <section className="adm-analytics-section">
                <div className="adm-analytics-header">
                  <div className="adm-section-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <h2 className="adm-section-h2">Analytics Overview</h2>
                </div>

                <div className="adm-analytics-grid">

                  {/* Chart 1 — Pie */}
                  <div className="adm-chart-card">
                    <h3 className="adm-chart-title">
                      <span className="adm-chart-title-dot" style={{ background: '#6366f1' }} />
                      Status Distribution
                    </h3>
                    <div className="adm-chart-body">
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
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2 — Bar */}
                  <div className="adm-chart-card">
                    <h3 className="adm-chart-title">
                      <span className="adm-chart-title-dot" style={{ background: '#3b82f6' }} />
                      Top Complaint Types
                    </h3>
                    <div className="adm-chart-body">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                          <Bar
                            dataKey="value"
                            name="Complaints"
                            fill={BAR_COLOR}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3 — Line (Trend) */}
                  <div className="adm-chart-card">
                    <h3 className="adm-chart-title">
                      <span className="adm-chart-title-dot" style={{ background: '#10b981' }} />
                      Recent Complaint Trend
                    </h3>
                    {trendData.length >= 1 ? (
                      <div className="adm-chart-body">
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0' }} />
                            <Area
                              type="monotone"
                              dataKey="count"
                              name="Complaints"
                              stroke={LINE_COLOR}
                              strokeWidth={2.5}
                              fill="url(#trendGrad)"
                              dot={{ r: 4, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6, fill: LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="adm-chart-no-data">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                        </svg>
                        <p>Not enough date data for trend chart.</p>
                      </div>
                    )}
                  </div>

                </div>
              </section>
            )}
          </>
        )}
      </main>



      {/* ══ ACCOUNT SETTINGS MODAL ════════════════════════════════════════ */}
      {acctModalOpen && (
        <div
          className="acct-modal-overlay"
          onClick={e => e.target === e.currentTarget && setAcctModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Account Settings"
        >
          <div className="acct-modal">

            {/* Modal Header */}
            <div className="acct-modal-header">
              <div className="acct-modal-title-group">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <h2 className="acct-modal-h2">Account Settings</h2>
              </div>
              <button className="adm-modal-close-btn" onClick={() => setAcctModalOpen(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Current Email display */}
            <div className="acct-modal-email-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
              <span className="acct-modal-email-label">Signed in as</span>
              <span className="acct-modal-email-value">{adminEmail || '—'}</span>
            </div>

            {/* Tab nav */}
            {acctView === 'main' && (
              <div className="acct-modal-tabs">
                <button
                  className="acct-modal-tab-btn"
                  onClick={() => { setAcctView('email'); setCeError(''); setCeSuccess(''); setCeNewEmail(''); setCeCurrentPwd(''); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                  <div>
                    <span className="acct-tab-title">Change Email</span>
                    <span className="acct-tab-desc">Update your admin email address</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  className="acct-modal-tab-btn"
                  onClick={() => { setAcctView('password'); setCpError(''); setCpSuccess(''); setCpCurrentPwd(''); setCpNewPwd(''); setCpConfirmPwd(''); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <div>
                    <span className="acct-tab-title">Change Password</span>
                    <span className="acct-tab-desc">Update your admin password</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Change Email Form */}
            {acctView === 'email' && (
              <div className="acct-modal-form-area">
                <button className="acct-modal-back" onClick={() => setAcctView('main')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <h3 className="acct-modal-form-h3">Change Email</h3>
                {ceSuccess && <div className="acct-success">{ceSuccess}</div>}
                {ceError   && <div className="acct-error">{ceError}</div>}
                <form onSubmit={handleChangeEmail} className="acct-form">
                  <div className="acct-field">
                    <label htmlFor="ce-new-email">New Email Address</label>
                    <input
                      id="ce-new-email"
                      type="email"
                      value={ceNewEmail}
                      onChange={e => setCeNewEmail(e.target.value)}
                      placeholder="new@email.com"
                      className="acct-input"
                    />
                  </div>
                  <div className="acct-field">
                    <label htmlFor="ce-current-pwd">Current Password</label>
                    <input
                      id="ce-current-pwd"
                      type="password"
                      value={ceCurrentPwd}
                      onChange={e => setCeCurrentPwd(e.target.value)}
                      placeholder="Enter current password to confirm"
                      className="acct-input"
                    />
                  </div>
                  <div className="acct-form-actions">
                    <button type="submit" className="acct-submit-btn" disabled={ceLoading}>
                      {ceLoading ? 'Updating…' : 'Update Email'}
                    </button>
                    <button type="button" className="acct-cancel-btn" onClick={() => setAcctView('main')}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password Form */}
            {acctView === 'password' && (
              <div className="acct-modal-form-area">
                <button className="acct-modal-back" onClick={() => setAcctView('main')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <h3 className="acct-modal-form-h3">Change Password</h3>
                {cpSuccess && <div className="acct-success">{cpSuccess}</div>}
                {cpError   && <div className="acct-error">{cpError}</div>}
                <form onSubmit={handleChangePassword} className="acct-form">
                  <div className="acct-field">
                    <label htmlFor="cp-current">Current Password</label>
                    <input
                      id="cp-current"
                      type="password"
                      value={cpCurrentPwd}
                      onChange={e => setCpCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                      className="acct-input"
                    />
                  </div>
                  <div className="acct-field">
                    <label htmlFor="cp-new">New Password</label>
                    <input
                      id="cp-new"
                      type="password"
                      value={cpNewPwd}
                      onChange={e => setCpNewPwd(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="acct-input"
                    />
                  </div>
                  <div className="acct-field">
                    <label htmlFor="cp-confirm">Confirm New Password</label>
                    <input
                      id="cp-confirm"
                      type="password"
                      value={cpConfirmPwd}
                      onChange={e => setCpConfirmPwd(e.target.value)}
                      placeholder="Re-enter new password"
                      className="acct-input"
                    />
                  </div>
                  <div className="acct-form-actions">
                    <button type="submit" className="acct-submit-btn" disabled={cpLoading}>
                      {cpLoading ? 'Changing…' : 'Change Password'}
                    </button>
                    <button type="button" className="acct-cancel-btn" onClick={() => setAcctView('main')}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══ COMPLAINT DETAILS MODAL ═══════════════════════════════════════════ */}
      {selectedComplaint && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <div className="adm-modal-title-group">
                <div className="adm-modal-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h2 className="adm-modal-h2">Complaint Details</h2>
                  <p className="adm-modal-sub">ID: {selectedComplaint.complaintId || selectedComplaint._id}</p>
                </div>
              </div>
              <button className="adm-modal-close-btn" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>


              </button>
            </div>

            <div className="adm-modal-body">
              {notification && (
                <div className="adm-notification-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {notification}
                </div>
              )}

              <div className="adm-detail-grid">
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Complaint ID</span>
                  <span className="adm-detail-value">{selectedComplaint.complaintId || selectedComplaint._id}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Current Status</span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Full Name</span>
                  <span className="adm-detail-value">{selectedComplaint.name || selectedComplaint.fullName || 'N/A'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Mobile Number</span>
                  <span className="adm-detail-value">{selectedComplaint.mobile || 'N/A'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Email Address</span>
                  <span className="adm-detail-value">{selectedComplaint.email || 'N/A'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Location / Area</span>
                  <span className="adm-detail-value">{selectedComplaint.location || 'N/A'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Quarter Number</span>
                  <span className="adm-detail-value">{selectedComplaint.quarter || 'N/A'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Complaint Type</span>
                  <span className="adm-detail-value">{selectedComplaint.complaint_type || selectedComplaint.type || selectedComplaint.complaintType || 'N/A'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-label">Submitted Date</span>
                  <span className="adm-detail-value">{formatDate(selectedComplaint.created_at || selectedComplaint.submittedAt || selectedComplaint.submittedDate)}</span>
                </div>
                {selectedComplaint.admin_remarks && (
                  <div className="adm-detail-item">
                    <span className="adm-detail-label">Previous Admin Remarks</span>
                    <span className="adm-detail-value">{selectedComplaint.admin_remarks}</span>
                  </div>
                )}
                <div className="adm-detail-item adm-detail-full">
                  <span className="adm-detail-label">Description</span>
                  <div className="adm-desc-box">{selectedComplaint.description || 'N/A'}</div>
                </div>

                {selectedComplaint.images && Array.isArray(selectedComplaint.images) && selectedComplaint.images.length > 0 && (
                  <div className="adm-detail-item adm-detail-full">
                    <span className="adm-detail-label">Uploaded Attachments</span>
                    <div className="adm-images-wrap">
                      {selectedComplaint.images.map((img, idx) =>
                        img ? (
                          <img
                            key={idx}
                            src={`data:image/jpeg;base64,${img}`}
                            alt={`Attachment ${idx + 1}`}
                            className="adm-attach-img"
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Action Panel */}
              <div className="adm-action-panel">
                <div className="adm-action-panel-head">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <h3 className="adm-action-panel-title">Admin Action Panel</h3>
                </div>
                <div className="adm-action-form">
                  <div className="adm-input-group">
                    <label className="adm-input-label">Update Status</label>
                    <select
                      id="adm-edit-status"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="adm-select"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="adm-input-group adm-input-full">
                    <label className="adm-input-label">Admin Remarks</label>
                    <textarea
                      id="adm-edit-remarks"
                      value={editRemarks}
                      onChange={e => setEditRemarks(e.target.value)}
                      placeholder="Enter admin remarks here…"
                      className="adm-textarea"
                    />
                  </div>
                  <button className="adm-save-btn" onClick={saveChanges}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
