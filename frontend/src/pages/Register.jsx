import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/Login.css';     // using same style system for consistency
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function RegisterWrapper() {
  return (
    <GoogleOAuthProvider clientId="691950725329-gr2888rno78hu3k3n1j17j3dl1o66ush.apps.googleusercontent.com">
      <Register />
    </GoogleOAuthProvider>
  );
}

function Register() {
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
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMsg(err.message);
    }
  }

  // Google sign-up handler
  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const res = await api.auth.googleLogin(token);

      const user = res;
      const access = res.token;

      if (!access) throw new Error('No token returned');

      // same behavior as your login
      navigate('/dashboard');
    } catch (err) {
      setMsg(err.message || 'Google signup failed');
    }
  };

  return (
    <div className="card auth-card">
      <h2>Register</h2>

      {msg && <div className="info">{msg}</div>}

      <form onSubmit={submit}>
        <label>Name</label>
        <input
          className="auth-input"
          placeholder="Firstname Lastname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Email</label>
        <input
          className="auth-input"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          className="auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="primary" type="submit">
          Sign Up
        </button>
      </form>

      <div className="auth-divider">OR</div>

      {/* Google Sign-Up Button */}
      <div className="google-btn-wrap signup">
        <GoogleLogin
          onSuccess={handleGoogleSignup}
          onError={() => setMsg('Google signup failed')}
          theme="outline"
          shape="rectangular"
          width="100%"
        />
      </div>

      <p>
        Already have an account?
        <button className="link-btn" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </p>
    </div>
  );
}
