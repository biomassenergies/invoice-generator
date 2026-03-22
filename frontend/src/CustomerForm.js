import React, { useState } from 'react';
import { createCustomer } from './api';
import './CustomerForm.css';

const initialForm = {
  code: '',
  customerName: '',
  address: '',
  gstn: '',
  stateName: '',
  pinCode: '',
  email: ''
};

function CustomerForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createCustomer(form);
      setSuccess(response.data?.message || 'Customer added successfully');
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-form-page">
      <div className="customer-form-shell">
        <header className="customer-form-header">
          <p className="customer-form-kicker">Customer Master</p>
          <h1>Add New Customer</h1>
          <p>Add a new customer record directly to the owner master sheet.</p>
        </header>

        <form className="customer-form-card" onSubmit={handleSubmit}>
          {error ? <div className="customer-form-alert error">{error}</div> : null}
          {success ? <div className="customer-form-alert success">{success}</div> : null}

          <div className="customer-form-grid">
            <label>
              <span>CODE *</span>
              <input
                type="text"
                value={form.code}
                onChange={(event) => handleChange('code', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Cust Name *</span>
              <input
                type="text"
                value={form.customerName}
                onChange={(event) => handleChange('customerName', event.target.value)}
                required
              />
            </label>

            <label className="customer-form-span-2">
              <span>Address</span>
              <textarea
                value={form.address}
                onChange={(event) => handleChange('address', event.target.value)}
                rows="3"
              />
            </label>

            <label>
              <span>GSTN</span>
              <input
                type="text"
                value={form.gstn}
                onChange={(event) => handleChange('gstn', event.target.value)}
              />
            </label>

            <label>
              <span>State Name</span>
              <input
                type="text"
                value={form.stateName}
                onChange={(event) => handleChange('stateName', event.target.value)}
              />
            </label>

            <label>
              <span>Pin Code</span>
              <input
                type="text"
                value={form.pinCode}
                onChange={(event) => handleChange('pinCode', event.target.value)}
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
              />
            </label>
          </div>

          <div className="customer-form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm;
