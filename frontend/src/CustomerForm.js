import React, { useEffect, useMemo, useState } from 'react';
import { createCustomer, getCustomers } from './api';
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
  const [loadingReference, setLoadingReference] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referenceCustomer, setReferenceCustomer] = useState(null);
  const [existingCodes, setExistingCodes] = useState([]);

  useEffect(() => {
    const loadCustomerReference = async () => {
      try {
        setLoadingReference(true);
        const response = await getCustomers();
        const rows = response.data?.data || [];
        const lastCustomer = rows.length ? rows[rows.length - 1] : null;
        setReferenceCustomer(lastCustomer);
        setExistingCodes(
          rows
            .map((row) => String(row.CODE || '').trim().toUpperCase())
            .filter(Boolean)
        );
      } catch (err) {
        setError('Unable to load latest customer reference');
      } finally {
        setLoadingReference(false);
      }
    };

    loadCustomerReference();
  }, []);

  const normalizedCode = form.code.trim().toUpperCase();
  const isDuplicateCode = useMemo(
    () => Boolean(normalizedCode && existingCodes.includes(normalizedCode)),
    [existingCodes, normalizedCode]
  );

  const handleChange = (field, value) => {
    if (field === 'code') {
      setError('');
      setSuccess('');
    }

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

    if (isDuplicateCode) {
      setError('This customer code already exists in CUSTOMER DETAILS');
      setLoading(false);
      return;
    }

    try {
      const response = await createCustomer(form);
      setSuccess(response.data?.message || 'Customer added successfully');
      setReferenceCustomer(response.data?.customer || null);
      if (normalizedCode) {
        setExistingCodes((current) => [...current, normalizedCode]);
      }
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

        <section className="customer-reference-card">
          <div className="customer-reference-header">
            <h2>Latest Customer Reference</h2>
            <span>{loadingReference ? 'Loading...' : 'Use this to avoid duplicate codes'}</span>
          </div>

          {referenceCustomer ? (
            <div className="customer-reference-grid">
              <div>
                <span>Latest CODE</span>
                <strong>{referenceCustomer.CODE || '-'}</strong>
              </div>
              <div>
                <span>Cust Name</span>
                <strong>{referenceCustomer['Cust Name'] || '-'}</strong>
              </div>
              <div className="customer-reference-span-2">
                <span>Address</span>
                <strong>{referenceCustomer.Address || '-'}</strong>
              </div>
              <div>
                <span>GSTN</span>
                <strong>{referenceCustomer.GSTN || '-'}</strong>
              </div>
              <div>
                <span>State Name</span>
                <strong>{referenceCustomer['State Name'] || '-'}</strong>
              </div>
              <div>
                <span>Pin Code</span>
                <strong>{referenceCustomer['Pin Code'] || '-'}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{referenceCustomer.Email || '-'}</strong>
              </div>
            </div>
          ) : (
            <p className="customer-reference-empty">No customer reference found yet.</p>
          )}
        </section>

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
              {isDuplicateCode ? (
                <small className="customer-code-warning">
                  This code already exists in the sheet. Please use a new code.
                </small>
              ) : null}
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
            <button type="submit" disabled={loading || isDuplicateCode}>
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm;
