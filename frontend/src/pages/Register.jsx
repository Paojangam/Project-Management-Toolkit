import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/Register.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api.auth.register({ name, email, password });
      setMsg('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500); // small delay for UX flair
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="card auth-card">
      <h2>Register</h2>
      {msg && <div className="info">{msg}</div>}
      <form onSubmit={submit}>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <button className="primary" type="submit">
          Register
        </button>
      </form>
      <p>
        Already have an account?{' '}
        <button className="link-btn" onClick={() => navigate('/login')}>
          Login
        </button>
      </p>
    </div>
  );
}
