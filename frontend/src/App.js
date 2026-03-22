import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom';
import Invoice from './Invoice';
import InvoiceLookup from './InvoiceLookup';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import firmDetails from './firmDetails';
import { getAuthStatus, logout } from './api';
import './App.css';

function AppShell() {
  const [authState, setAuthState] = useState({
    loading: true,
    enabled: false,
    authenticated: false
  });

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const { data } = await getAuthStatus();
        setAuthState({
          loading: false,
          enabled: Boolean(data.enabled),
          authenticated: Boolean(data.authenticated)
        });
      } catch (error) {
        setAuthState({
          loading: false,
          enabled: true,
          authenticated: false
        });
      }
    };

    loadAuthState();

    const handleAuthRequired = () => {
      setAuthState((current) => ({
        ...current,
        loading: false,
        authenticated: false
      }));
    };

    window.addEventListener('invoice-auth-required', handleAuthRequired);
    return () => window.removeEventListener('invoice-auth-required', handleAuthRequired);
  }, []);

  const handleLoginSuccess = ({ enabled }) => {
    setAuthState({
      loading: false,
      enabled: Boolean(enabled),
      authenticated: true
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setAuthState((current) => ({
        ...current,
        authenticated: false
      }));
    }
  };

  if (authState.loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card">
          <h1>{firmDetails.name}</h1>
          <p>Loading secure workspace...</p>
        </div>
      </div>
    );
  }

  if (authState.enabled && !authState.authenticated) {
    return <LoginPage firmName={firmDetails.name} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">{firmDetails.name}</div>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Create Invoice
            </NavLink>
            <NavLink
              to="/lookup"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Lookup Invoice
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Dashboard
            </NavLink>
            {authState.enabled ? (
              <button type="button" className="nav-link nav-button" onClick={handleLogout}>
                Log Out
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Invoice />} />
        <Route path="/lookup" element={<InvoiceLookup />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
