import React, { useEffect, useState } from 'react';
import { getDashboard } from './api';
import firmDetails from './firmDetails';
import './Dashboard.css';

const monthLabels = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
};

function Dashboard() {
  const [filters, setFilters] = useState({
    year: '',
    month: '',
    customer: '',
    product: ''
  });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard(filters);
  }, [filters]);

  const loadDashboard = async (nextFilters) => {
    try {
      setLoading(true);
      setError('');
      const response = await getDashboard(nextFilters);
      setDashboard(response.data);
    } catch (err) {
      setError(err.response?.data?.details || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const resetFilters = () => {
    setFilters({ year: '', month: '', customer: '', product: '' });
  };

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return `Rs ${numeric.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const renderRankedList = (title, entries, metricLabel, metricKey) => {
    const maxValue = Math.max(...entries.map((entry) => entry[metricKey]), 0);

    return (
      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>{title}</h3>
        </div>
        {entries.length === 0 ? (
          <p className="panel-empty">No data for the selected filters.</p>
        ) : (
          <div className="rank-list">
            {entries.map((entry) => (
              <div key={entry.name} className="rank-item">
                <div className="rank-text">
                  <strong>{entry.name}</strong>
                  <span>{metricLabel}: {metricKey === 'sales' ? formatCurrency(entry[metricKey]) : entry[metricKey]}</span>
                </div>
                <div className="rank-bar-track">
                  <div
                    className="rank-bar-fill"
                    style={{ width: `${maxValue ? (entry[metricKey] / maxValue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  if (loading && !dashboard) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="hero-kicker">Sales Dashboard</p>
          <h1>{firmDetails.name}</h1>
          <p>
            Track revenue, category split, customer momentum, and product demand
            with time-based filters built around your invoice data.
          </p>
        </div>
      </header>

      <div className="dashboard-shell">
        {error && <div className="dashboard-error">{error}</div>}

        <section className="dashboard-panel filters-panel">
          <div className="panel-header">
            <h3>Filters</h3>
            <button type="button" className="clear-filters" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="filters-grid">
            <label>
              <span>Year</span>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="">All years</option>
                {(dashboard?.filters.options.years || []).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Month</span>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="">All months</option>
                {(dashboard?.filters.options.months || []).map((month) => (
                  <option key={month} value={month}>
                    {monthLabels[month] || month}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Customer</span>
              <select
                value={filters.customer}
                onChange={(e) => handleFilterChange('customer', e.target.value)}
              >
                <option value="">All customers</option>
                {(dashboard?.filters.options.customers || []).map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Product</span>
              <select
                value={filters.product}
                onChange={(e) => handleFilterChange('product', e.target.value)}
              >
                <option value="">All products</option>
                {(dashboard?.filters.options.products || []).map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <span>Total Sales</span>
            <strong>{formatCurrency(dashboard?.summary.totalSales)}</strong>
          </article>
          <article className="summary-card">
            <span>Invoice Count</span>
            <strong>{dashboard?.summary.invoiceCount || 0}</strong>
          </article>
          <article className="summary-card">
            <span>Average Invoice</span>
            <strong>{formatCurrency(dashboard?.summary.averageInvoiceValue)}</strong>
          </article>
          <article className="summary-card">
            <span>Total Quantity</span>
            <strong>{Number(dashboard?.summary.totalQuantity || 0).toLocaleString('en-IN')}</strong>
          </article>
          <article className="summary-card">
            <span>Active Customers</span>
            <strong>{dashboard?.summary.customerCount || 0}</strong>
          </article>
        </section>

        <div className="dashboard-layout">
          {renderRankedList('Product Category Split', dashboard?.categorySplit || [], 'Sales', 'sales')}
          {renderRankedList('Top Customers', dashboard?.topCustomers || [], 'Sales', 'sales')}
          {renderRankedList('Frequent Customers', dashboard?.frequentCustomers || [], 'Invoice Rows', 'count')}
          {renderRankedList('Frequent Products', dashboard?.frequentProducts || [], 'Invoice Rows', 'count')}
          {renderRankedList('Top Products by Sales', dashboard?.topProducts || [], 'Sales', 'sales')}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
