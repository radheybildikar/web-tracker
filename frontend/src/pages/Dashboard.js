import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth, API } from '../context/AuthContext';

function FaviconOrPlaceholder({ favicon, domain }) {
  const [failed, setFailed] = useState(false);
  if (!favicon || failed) {
    return (
      <div className="visit-favicon-placeholder">
        {domain?.[0]?.toUpperCase() || '?'}
      </div>
    );
  }
  return <img className="visit-favicon" src={favicon} alt="" onError={() => setFailed(true)} />;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload[0].value} visits</div>
    </div>
  );
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [date, setDate] = useState('');
  const [visitsLoading, setVisitsLoading] = useState(true);

  const loadVisits = useCallback(async () => {
    setVisitsLoading(true);
    try {
      const params = { page, limit: 15 };
      if (date) params.date = date;
      const { data } = await axios.get(`${API}/visits`, { params });
      setVisits(data.visits);
      setTotalPages(data.pages);
    } catch (e) { console.error(e); }
    finally { setVisitsLoading(false); }
  }, [page, date]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/visits/stats`);
      setStats(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadVisits(); }, [loadVisits]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const deleteVisit = async (id) => {
    await axios.delete(`${API}/visits/${id}`);
    setVisits(v => v.filter(x => x._id !== id));
    loadStats();
  };

  const maxDomain = stats?.topDomains?.[0]?.count || 1;

  return (
    <div className="page">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">⬡ WebTrace</div>
        <div className="nav-user">
          <span>👤 {user?.username}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="dashboard-main">
        <div className="container">
          {/* Stats row */}
          <div className="stats-grid">
            <div className="stat-card accent">
              <div className="stat-label">Today</div>
              <div className="stat-value">{stats?.todayCount ?? '—'}</div>
              <div className="stat-sub">pages visited</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">This week</div>
              <div className="stat-value">{stats?.weekCount ?? '—'}</div>
              <div className="stat-sub">total visits</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Top site</div>
              <div className="stat-value" style={{ fontSize: 20, paddingTop: 6 }}>
                {stats?.topDomains?.[0]?._id || '—'}
              </div>
              <div className="stat-sub">{stats?.topDomains?.[0]?.count} visits this week</div>
            </div>
          </div>

          {/* Main grid */}
          <div className="dashboard-grid">
            {/* Left: history */}
            <div>
              <div className="panel" style={{ marginBottom: 24 }}>
                {/* Activity chart */}
                <div className="panel-header">
                  <span className="panel-title">Activity — last 7 days</span>
                </div>
                <div className="panel-body" style={{ paddingTop: 8 }}>
                  {stats?.dailyActivity?.length ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={stats.dailyActivity} barSize={24}>
                        <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,142,255,0.06)' }} />
                        <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No data yet
                    </div>
                  )}
                </div>
              </div>

              {/* Visit history */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Browse history</span>
                  <div className="filter-row" style={{ margin: 0 }}>
                    <input
                      type="date"
                      className="date-input"
                      value={date}
                      onChange={e => { setDate(e.target.value); setPage(1); }}
                    />
                    {date && (
                      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setDate(''); setPage(1); }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {visitsLoading ? (
                  <div className="loading">Loading visits…</div>
                ) : visits.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🌐</div>
                    <div className="empty-title">No visits recorded yet</div>
                    <div>Install the Chrome extension to start tracking</div>
                  </div>
                ) : (
                  <>
                    <div className="visit-list">
                      {visits.map(v => (
                        <div className="visit-item" key={v._id}>
                          <FaviconOrPlaceholder favicon={v.favicon} domain={v.domain} />
                          <div className="visit-info">
                            <div className="visit-title">{v.title || v.domain}</div>
                            <div className="visit-url">{v.url}</div>
                          </div>
                          <div className="visit-time">{formatTime(v.visitedAt)}</div>
                          <button className="btn btn-danger" onClick={() => deleteVisit(v._id)}>✕</button>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                        <span className="page-info">Page {page} of {totalPages}</span>
                        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right: top domains */}
            <div>
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Top sites — this week</span>
                </div>
                <div className="panel-body">
                  {!stats?.topDomains?.length ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No data yet</div>
                  ) : (
                    stats.topDomains.map(d => (
                      <div className="domain-item" key={d._id}>
                        <div className="domain-bar-wrap">
                          <div className="domain-name">{d._id}</div>
                          <div className="domain-bar-bg">
                            <div className="domain-bar" style={{ width: `${(d.count / maxDomain) * 100}%` }} />
                          </div>
                        </div>
                        <div className="domain-count">{d.count}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
