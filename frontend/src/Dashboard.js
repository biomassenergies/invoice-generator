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
    setFilters((current) => ({
      ...current,
      [field]: value
    }));
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

  const formatCompactCurrency = (value) => {
    const numeric = Number(value || 0);
    return `Rs ${numeric.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    })}`;
  };

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const renderRankedList = (title, entries, metricLabel, metricKey, formatter = (value) => value) => {
    const maxValue = Math.max(...entries.map((entry) => Number(entry[metricKey] || 0)), 0);

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
                  <span>{metricLabel}: {formatter(entry[metricKey])}</span>
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

  const renderTagList = (title, items, tone = 'neutral') => (
    <section className="dashboard-panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="panel-empty">No issues found for this view.</p>
      ) : (
        <div className="tag-list">
          {items.map((item) => (
            <span key={item} className={`tag-pill ${tone}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );

  if (loading && !dashboard) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  const concentration = dashboard?.insights?.concentration || {};
  const marketMix = dashboard?.insights?.marketMix || {};
  const dataQuality = dashboard?.insights?.dataQuality || {};
  const dormantCustomers = dashboard?.insights?.dormantCustomers || [];

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="hero-kicker">Sales Dashboard</p>
          <h1>{firmDetails.name}</h1>
          <p>
            Track revenue, concentration risk, dormant customers, market mix, and
            data cleanup opportunities from your live invoice history.
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
            <span>Median Invoice</span>
            <strong>{formatCurrency(dashboard?.summary.medianInvoiceValue)}</strong>
          </article>
          <article className="summary-card">
            <span>Active Customers</span>
            <strong>{dashboard?.summary.customerCount || 0}</strong>
          </article>
          <article className="summary-card">
            <span>Total Quantity</span>
            <strong>{Number(dashboard?.summary.totalQuantity || 0).toLocaleString('en-IN')}</strong>
          </article>
        </section>

        <section className="signal-grid">
          <article className="signal-card warning">
            <span>Top 5 Customer Share</span>
            <strong>{formatPercent(concentration.top5CustomerShare)}</strong>
            <p>How much of current sales depend on your top five accounts.</p>
          </article>
          <article className="signal-card warning">
            <span>Top 5 Product Share</span>
            <strong>{formatPercent(concentration.top5ProductShare)}</strong>
            <p>How concentrated sales are in your biggest product lines.</p>
          </article>
          <article className="signal-card">
            <span>Interstate Sales</span>
            <strong>{formatCompactCurrency(marketMix.interstateSales)}</strong>
            <p>{marketMix.interstateInvoices || 0} interstate invoices in this filtered view.</p>
          </article>
          <article className="signal-card">
            <span>Intrastate Sales</span>
            <strong>{formatCompactCurrency(marketMix.intrastateSales)}</strong>
            <p>{marketMix.intrastateInvoices || 0} intrastate invoices in this filtered view.</p>
          </article>
        </section>

        <div className="dashboard-layout">
          {renderRankedList('Top Customers', dashboard?.topCustomers || [], 'Sales', 'sales', formatCurrency)}
          {renderRankedList('Top Products by Sales', dashboard?.topProducts || [], 'Sales', 'sales', formatCurrency)}
          {renderRankedList('Product Category Split', dashboard?.categorySplit || [], 'Sales', 'sales', formatCurrency)}
          {renderRankedList('Frequent Customers', dashboard?.frequentCustomers || [], 'Invoice Rows', 'count')}
          {renderRankedList('Frequent Products', dashboard?.frequentProducts || [], 'Invoice Rows', 'count')}
          {renderRankedList('Top Destinations', dashboard?.topDestinations || [], 'Sales', 'sales', formatCurrency)}
        </div>

        <div className="insight-grid">
          <section className="dashboard-panel">
            <div className="panel-header">
              <h3>Dormant Customers</h3>
            </div>
            {dormantCustomers.length === 0 ? (
              <p className="panel-empty">No dormant customers found.</p>
            ) : (
              <div className="dormant-list">
                {dormantCustomers.map((entry) => (
                  <div key={`${entry.name}-${entry.lastInvoiceDate}`} className="dormant-item">
                    <strong>{entry.name}</strong>
                    <span>Last invoice: {entry.lastInvoiceDate}</span>
                    <span>{entry.invoices} invoice rows</span>
                    <span>{formatCurrency(entry.sales)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-header">
              <h3>Master Data Signals</h3>
            </div>
            <div className="quality-metrics">
              <div className="quality-metric">
                <span>Invoice-only Customers</span>
                <strong>{dataQuality.invoiceOnlyCustomerCount || 0}</strong>
              </div>
              <div className="quality-metric">
                <span>Master-only Customers</span>
                <strong>{dataQuality.masterOnlyCustomerCount || 0}</strong>
              </div>
              <div className="quality-metric">
                <span>Unsold Products</span>
                <strong>{(dataQuality.unsoldProducts || []).length}</strong>
              </div>
            </div>
          </section>

          {renderTagList('Invoice Customers Missing in Master', dataQuality.invoiceOnlyCustomers || [], 'warning')}
          {renderTagList('Customers in Master Without Sales', dataQuality.masterOnlyCustomers || [], 'neutral')}
          {renderTagList('Unsold Products', dataQuality.unsoldProducts || [], 'good')}

          <section className="dashboard-panel">
            <div className="panel-header">
              <h3>Customer Name Variants</h3>
            </div>
            {(dataQuality.customerVariants || []).length === 0 ? (
              <p className="panel-empty">No naming variants found.</p>
            ) : (
              <div className="variant-list">
                {dataQuality.customerVariants.map((group) => (
                  <div key={group.canonical} className="variant-item">
                    <strong>{group.canonical}</strong>
                    <div className="tag-list">
                      {group.variants.map((variant) => (
                        <span key={variant} className="tag-pill neutral">
                          {variant}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
