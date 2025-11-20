import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import '../styles/Dashboard.css';

function monthLabel(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const it of items) {
    const k = keyFn(it) ?? 'Unknown';
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="dashboard-wrap"><div className="err">{err}</div></div>;
  if (!stats) return <div className="dashboard-wrap"><div className="loading">Loading...</div></div>;

  const totalTasks = stats.totalTasks ?? 0;
  const doneCount = stats.done ?? 0;
  const percent = stats.percent ?? (totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0);

  const tasks = Array.isArray(stats.tasks) ? stats.tasks : [];

  let donutData;
  if (tasks.length) {
    const doneTasks = tasks.filter(t => {
      const s = (t.status || '').toString().toLowerCase();
      return s === 'done' || s === 'completed' || s === 'finished';
    });
    const byCategory = countBy(doneTasks, t => (t.category || 'Other'));
    donutData = Array.from(byCategory.entries()).map(([name, value]) => ({ name, value }));
    if (!donutData.length) donutData = null;
  } else {
    donutData = null;
  }

  if (!donutData) {
    donutData = (stats.breakdown && stats.breakdown.length)
      ? stats.breakdown
      : [
          { name: 'Design', value: Math.round((totalTasks || 1) * 0.3) },
          { name: 'Dev', value: Math.round((totalTasks || 1) * 0.22) },
          { name: 'QA', value: Math.round((totalTasks || 1) * 0.21) },
          { name: 'Doc', value: Math.round((totalTasks || 1) * 0.12) },
          { name: 'Ops', value: Math.round((totalTasks || 1) * 0.08) },
          { name: 'Other', value: Math.round((totalTasks || 1) * 0.07) },
        ];
  }

  const DONUT_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#60C1B8'];

  let barData;
  if (tasks.length) {
    const monthCounts = countBy(tasks, t => {
      const created = t.createdAt || t.created || t.date;
      if (created) return monthLabel(created);
      const pdate = t.projectDate || (t.project && t.project.createdAt) || null;
      if (pdate) return monthLabel(pdate);
      return 'Unknown';
    });

    barData = Array.from(monthCounts.entries())
      .map(([period, value]) => ({ period, value }))
      .sort((a, b) => (a.period > b.period ? 1 : (a.period < b.period ? -1 : 0)));
  } else if (stats.history && stats.history.length) {
    barData = stats.history.map(h => ({ period: h.period, value: h.value }));
  } else {
    barData = [
      { period: 'Jan', value: 40 },
      { period: 'Feb', value: 55 },
      { period: 'Mar', value: 70 },
      { period: 'Apr', value: 60 },
      { period: 'May', value: 80 },
      { period: 'Jun', value: 75 },
    ];
  }

  barData = barData.sort((a, b) => {
    if (a.period === 'Unknown') return 1;
    if (b.period === 'Unknown') return -1;
    return a.period.localeCompare(b.period);
  });

  const pieData = [
    { name: 'Done', value: doneCount || 0 },
    { name: 'Remaining', value: Math.max((totalTasks || 0) - (doneCount || 0), 0) },
  ];
  const PIE_COLORS = ['#60A5FA', '#C7E0FA'];

  return (
    <div className="dashboard-wrap">
      <header className="dashboard-top">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="top-tiles">
          <div className="tile">
            <div className="tile-num">{totalTasks}</div>
            <div className="tile-label">Total tasks</div>
          </div>
          <div className="tile">
            <div className="tile-num">{doneCount}</div>
            <div className="tile-label">Done</div>
          </div>
          <div className="tile">
            <div className="tile-num">{percent}%</div>
            <div className="tile-label">Complete</div>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="big-donut card">
          <div className="card-head">Team activities (completed by category)</div>
          <div className="donut-area" style={{ padding: 8 }}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`d-${idx}`} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="right-column">
          <section className="card mini-bar">
            <div className="card-head">Activity over time (tasks created)</div>
            <div className="bar-area" style={{ padding: 8 }}>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis dataKey="period" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6,6,0,0]} fill="#93C5FD" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
