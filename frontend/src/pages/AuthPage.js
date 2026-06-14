import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">⬡ WebTrace</div>
        <div className="auth-subtitle">Track every page you visit, privately.</div>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>

        <br />
        {error && <div className="error-msg">{error}</div>}

        {mode === 'register' && (
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} onChange={set('username')} placeholder="yourname" onKeyDown={handleKey} />
          </div>
        )}
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" onKeyDown={handleKey} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" onKeyDown={handleKey} />
        </div>

        <br />
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>No account? <span onClick={() => { setMode('register'); setError(''); }}>Sign up</span></>
          ) : (
            <>Already have one? <span onClick={() => { setMode('login'); setError(''); }}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}
