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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="dashboard-wrap"><div className="err">{err}</div></div>;
  if (!stats) return <div className="dashboard-wrap"><div className="loading">Loading...</div></div>;

  const pieData = [
    { name: 'Done', value: stats.done || 0 },
    { name: 'Remaining', value: Math.max((stats.totalTasks || 0) - (stats.done || 0), 0) },
  ];
  const PIE_COLORS = ['#60A5FA', '#C7E0FA']; // blue + pale blue

  const donutData = (stats.breakdown && stats.breakdown.length)
    ? stats.breakdown
    : [
        { name: 'Design', value: Math.round((stats.totalTasks || 1) * 0.3) },
        { name: 'Dev', value: Math.round((stats.totalTasks || 1) * 0.22) },
        { name: 'QA', value: Math.round((stats.totalTasks || 1) * 0.21) },
        { name: 'Doc', value: Math.round((stats.totalTasks || 1) * 0.12) },
        { name: 'Ops', value: Math.round((stats.totalTasks || 1) * 0.08) },
        { name: 'Other', value: Math.round((stats.totalTasks || 1) * 0.07) },
      ];
  const DONUT_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#60C1B8'];

  const barData = (stats.history && stats.history.length) ? stats.history : [
    { period: 'Jan', value: 40 },
    { period: 'Feb', value: 55 },
    { period: 'Mar', value: 70 },
    { period: 'Apr', value: 60 },
    { period: 'May', value: 80 },
    { period: 'Jun', value: 75 },
  ];

  return (
    <div className="dashboard-wrap">
      <header className="dashboard-top">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="top-tiles">
          <div className="tile">
            <div className="tile-num">{stats.totalTasks ?? 0}</div>
            <div className="tile-label">Total tasks</div>
          </div>
          <div className="tile">
            <div className="tile-num">{stats.done ?? 0}</div>
            <div className="tile-label">Done</div>
          </div>
          <div className="tile">
            <div className="tile-num">{stats.percent ?? 0}%</div>
            <div className="tile-label">Complete</div>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="big-donut card">
          <div className="card-head">Team activities</div>
          <div className="donut-area">
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
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`d-${idx}`} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="right-column">
          <section className="card summary-table">
            <div className="card-head">Budgeted income</div>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Actual</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jun</td>
                  <td>160 124</td>
                  <td>120 000</td>
                  <td><div className="status-bar" style={{'--pct':'70%'}}><span/></div></td>
                  <td className="pos">+40 124</td>
                </tr>
                <tr>
                  <td>Q2</td>
                  <td>416 718</td>
                  <td>360 000</td>
                  <td><div className="status-bar" style={{'--pct':'75%'}}><span/></div></td>
                  <td className="pos">+56 718</td>
                </tr>
                <tr>
                  <td>Year</td>
                  <td>1 431 337</td>
                  <td>1 290 000</td>
                  <td><div className="status-bar" style={{'--pct':'85%'}}><span/></div></td>
                  <td className="pos">+141 337</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="card mini-bar">
            <div className="card-head">Activity over time</div>
            <div className="bar-area">
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
