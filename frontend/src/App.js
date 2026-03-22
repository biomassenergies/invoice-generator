import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Invoice from './Invoice';
import InvoiceLookup from './InvoiceLookup';
import Dashboard from './Dashboard';
import firmDetails from './firmDetails';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('create');

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="navbar-content">
            <div className="navbar-brand">{firmDetails.name}</div>
            <div className="nav-links">
              <Link
                to="/"
                className={`nav-link ${currentPage === 'create' ? 'active' : ''}`}
                onClick={() => setCurrentPage('create')}
              >
                Create Invoice
              </Link>
              <Link
                to="/lookup"
                className={`nav-link ${currentPage === 'lookup' ? 'active' : ''}`}
                onClick={() => setCurrentPage('lookup')}
              >
                Lookup Invoice
              </Link>
              <Link
                to="/dashboard"
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Invoice />} />
          <Route path="/lookup" element={<InvoiceLookup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
