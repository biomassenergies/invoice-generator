import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';
import Invoice from './Invoice';
import InvoiceLookup from './InvoiceLookup';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import LandingPage from './LandingPage';
import firmDetails from './firmDetails';
import { getAuthStatus, logout } from './api';
import './App.css';

function AppLoading() {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-card">
        <img src={`${process.env.PUBLIC_URL}/mae-logo.png`} alt={firmDetails.name} className="brand-logo loading-logo" />
        <h1>{firmDetails.name}</h1>
        <p>Loading secure workspace...</p>
      </div>
    </div>
  );
}

function AdminLayout({ authEnabled, onLogout }) {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-content">
          <NavLink to="/admin/create" className="navbar-brand">
            <img src={`${process.env.PUBLIC_URL}/mae-logo.png`} alt={firmDetails.name} className="brand-logo" />
            <div className="brand-copy">
              <strong>{firmDetails.name}</strong>
              <span>{firmDetails.address}</span>
              <span>
                GSTN: {firmDetails.gstn} | {firmDetails.contactNo}
              </span>
            </div>
          </NavLink>
          <div className="nav-links">
            <NavLink
              to="/admin/create"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Create Invoice
            </NavLink>
            <NavLink
              to="/admin/lookup"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Lookup Invoice
            </NavLink>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Dashboard
            </NavLink>
            <NavLink to="/" className="nav-link">
              Public Site
            </NavLink>
            {authEnabled ? (
              <button type="button" className="nav-link nav-button" onClick={onLogout}>
                Log Out
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

function OwnerLoginRoute({ authEnabled, authenticated, onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = location.state?.from?.pathname || '/admin/create';

  if (!authEnabled || authenticated) {
    return <Navigate to={nextPath} replace />;
  }

  return (
    <LoginPage
      firmName={firmDetails.name}
      onLoginSuccess={(data) => {
        onLoginSuccess(data);
        navigate(nextPath, { replace: true });
      }}
    />
  );
}

function ProtectedAdminRoute({ authEnabled, authenticated }) {
  const location = useLocation();

  if (!authEnabled) {
    return <Outlet />;
  }

  if (!authenticated) {
    return <Navigate to="/owner-login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

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
    return <AppLoading />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/owner-login"
        element={
          <OwnerLoginRoute
            authEnabled={authState.enabled}
            authenticated={authState.authenticated}
            onLoginSuccess={handleLoginSuccess}
          />
        }
      />

      <Route
        element={
          <ProtectedAdminRoute
            authEnabled={authState.enabled}
            authenticated={authState.authenticated}
          />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout authEnabled={authState.enabled} onLogout={handleLogout} />}
        >
          <Route index element={<Navigate to="/admin/create" replace />} />
          <Route path="create" element={<Invoice />} />
          <Route path="lookup" element={<InvoiceLookup />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
