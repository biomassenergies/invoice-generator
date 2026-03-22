import React, { useState } from 'react';
import { login } from './api';
import firmDetails from './firmDetails';
import './LoginPage.css';

function LoginPage({ firmName, onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await login(password);
      setPassword('');
      onLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">Secure Invoice Portal</p>
        <h1>{firmName}</h1>
        <p className="login-subtitle">
          Enter the shared password to access invoice creation, lookup, and dashboard data.
        </p>

        <div className="login-firm-block">
          <p>{firmDetails.address}</p>
          <p>GSTN: {firmDetails.gstn}</p>
          <p>Contact: {firmDetails.contact}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
