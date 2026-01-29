import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/Login.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginWrapper({ onLoginSuccess }) {
  // Wrap the Login component with GoogleOAuthProvider
  return (
    <GoogleOAuthProvider clientId="691950725329-gr2888rno78hu3k3n1j17j3dl1o66ush.apps.googleusercontent.com">
      <Login onLoginSuccess={onLoginSuccess} />
    </GoogleOAuthProvider>
  );
}

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  // Google login callback
  const handleGoogleResponse = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential; // JWT from Google
      const res = await api.auth.googleLogin(token);

      const user = res;
      const accessToken = res.token;

      if (!accessToken) throw new Error('No token from server');

      onLoginSuccess(user, accessToken);
      navigate('/dashboard');
    } catch (error) {
      setErr(error.message || 'Google login failed');
    }
  };

  // Normal email/password login
  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.auth.login({ email, password });
      const token = res.token || res.accessToken || res.data?.token;
      const user = res.user || res;

      if (!token) throw new Error('No token returned from server');

      onLoginSuccess(user, token);
      navigate('/dashboard');
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div className="card auth-card">
      <h2>Login</h2>
      {err && <div className="err">{err}</div>}

      {/* Email/password login form */}
      <form onSubmit={submit}>
        <label>Email</label>
        <input
  className="auth-input"
  type="email"
  placeholder="example@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>

<label>Password</label>

<input
  className="auth-input"
  type="password"
  placeholder="Enter your password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>

        <button className="primary" type="submit">Sign In</button>
      </form>

      {/* Divider */}

      {/* Google Sign-In button */}
      <div className="google-btn-wrap">
  <GoogleLogin
    onSuccess={handleGoogleResponse}
    onError={() => setErr('Google login failed')}
    theme="outline"
    shape="rectangular"
    width="100%"
  />
</div>


      <p>
        No account?{' '}
        <button className="link-btn" onClick={() => navigate('/register')}>
          Sign Up
        </button>
      </p>
    </div>
  );
}
