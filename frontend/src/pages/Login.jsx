import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.auth.login({ email, password });
      const token = res.token || res.accessToken || res.data?.token;
      const user = res.user || res;

      if (!token) throw new Error('No token returned from server');

      onLoginSuccess(user, token);
      navigate('/dashboard'); // or wherever you want after successful login
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div className="card auth-card">
      <h2>Login</h2>
      {err && <div className="err">{err}</div>}
      <form onSubmit={submit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="primary" type="submit">Login</button>
      </form>
      <p>
        No account?{' '}
        <button className="link-btn" onClick={() => navigate('/register')}>
          Register
        </button>
      </p>
    </div>
  );
}
