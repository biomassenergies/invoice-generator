import React, { useEffect, useState } from 'react';
import {
  getCustomers,
  getProducts,
  createInvoice,
  downloadInvoicePDF
} from './api';
import './Invoice.css';

function Invoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerHeaders, setCustomerHeaders] = useState([]);
  const [productHeaders, setProductHeaders] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerState, setCustomerState] = useState('');
  const [transport, setTransport] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [destination, setDestination] = useState('');
  const [items, setItems] = useState([{ product: '', hsn: '', qty: 1, rate: 0 }]);
  const [totals, setTotals] = useState({
    taxable: 0,
    sgst: 0,
    cgst: 0,
    igst: 0,
    grand: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const getCustomerNameField = () =>
    customerHeaders.find((header) => header.toLowerCase().includes('name')) || 'Customer Name';

  const getCustomerStateField = () =>
    customerHeaders.find((header) => header.toLowerCase().includes('state')) || 'State';

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([getCustomers(), getProducts()]);
      setCustomerHeaders(custRes.data.headers);
      setCustomers(custRes.data.data);
      setProductHeaders(prodRes.data.headers);
      setProducts(prodRes.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
      setLoading(false);
    }
  };

  const calculateTotals = (itemsList, stateValue = customerState) => {
    let taxable = 0;
    let sgst = 0;
    let cgst = 0;
    let igst = 0;

    itemsList.forEach((item) => {
      const amount = item.qty * item.rate;
      taxable += amount;

      if (stateValue === 'Maharashtra') {
        sgst += amount * 0.025;
        cgst += amount * 0.025;
      } else {
        igst += amount * 0.05;
      }
    });

    setTotals({
      taxable,
      sgst,
      cgst,
      igst,
      grand: taxable + sgst + cgst + igst
    });
  };

  const handleCustomerChange = (e) => {
    const customerName = e.target.value;
    const nameField = getCustomerNameField();
    const customer = customers.find(
      (entry) => entry[nameField] === customerName || entry['Customer Name'] === customerName
    );

    if (customer) {
      setSelectedCustomer(customer);
      const stateField = getCustomerStateField();
      const state = stateField ? customer[stateField] : customer.State || '';
      setCustomerState(state);
      calculateTotals(items, state);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'product') {
      const product = products.find(
        (entry) => entry[productHeaders[0]] === value || entry['Product Name'] === value
      );
      if (product) {
        const rateField = productHeaders.find((header) => header.toLowerCase().includes('rate'));
        const hsnField = productHeaders.find((header) => header.toLowerCase().includes('hsn'));
        updated[index].rate = Number(product[rateField] || product.Rate || 0);
        updated[index].hsn = product[hsnField] || product['HSN Code'] || '';
      }
    }

    if (field === 'qty' || field === 'rate') {
      updated[index][field] = Number(value);
    }

    setItems(updated);
    calculateTotals(updated);
  };

  const handleAddItem = () => {
    const updated = [...items, { product: '', hsn: '', qty: 1, rate: 0 }];
    setItems(updated);
    calculateTotals(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(updated);
    calculateTotals(updated);
  };

  const downloadPDF = async (invNumber) => {
    try {
      const response = await downloadInvoicePDF(invNumber);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Error downloading PDF: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!invoiceNumber) {
      setError('Please enter invoice number');
      return;
    }

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (items.length === 0 || !items[0].product) {
      setError('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      const customerNameField = getCustomerNameField();
      const consigneeName =
        selectedCustomer[customerNameField] || selectedCustomer['Customer Name'];

      const payload = {
        invoiceNumber,
        consigneeName,
        buyer: consigneeName,
        date: new Date().toISOString().split('T')[0],
        customerState,
        items: items.map((item) => ({
          product: item.product,
          hsn: item.hsn || '',
          qty: item.qty,
          rate: item.rate,
          per: 'unit'
        })),
        transport,
        vehicle,
        destination
      };

      await createInvoice(payload);
      setSuccess(`Invoice ${invoiceNumber} created successfully!`);

      setInvoiceNumber('');
      setSelectedCustomer(null);
      setCustomerState('');
      setItems([{ product: '', hsn: '', qty: 1, rate: 0 }]);
      setTransport('');
      setVehicle('');
      setDestination('');
      setTotals({ taxable: 0, sgst: 0, cgst: 0, igst: 0, grand: 0 });

      setTimeout(() => {
        downloadPDF(invoiceNumber);
      }, 500);

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating invoice: ' + err.message);
      setLoading(false);
    }
  };

  const printInvoice = async () => {
    if (!invoiceNumber) {
      setError('Please save invoice first');
      return;
    }
    downloadPDF(invoiceNumber);
  };

  if (loading && customers.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="invoice-container">
      <header className="invoice-header">
        <h1>Create Invoice</h1>
        <p>Prepare invoices quickly with customer, product, tax, and transport details in one flow.</p>
      </header>

      <div className="invoice-content">
        <form onSubmit={handleSubmit} className="invoice-form">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <section className="form-section">
            <h2>Invoice Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., MAE/001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  disabled
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Customer Information</h2>
            <div className="form-group">
              <label>Customer *</label>
              <select onChange={handleCustomerChange} required>
                <option value="">Select Customer</option>
                {customers.map((customer, index) => {
                  const nameField = getCustomerNameField();
                  const customerName =
                    customer[nameField] || customer['Customer Name'] || `Customer ${index}`;
                  return (
                    <option key={index} value={customerName}>
                      {customerName}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedCustomer && (
              <div className="customer-details">
                <p>
                  <strong>State: </strong>
                  <span className="state-badge">{customerState}</span>
                </p>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  GST Type: {customerState === 'Maharashtra' ? 'CGST + SGST' : 'IGST'}
                </p>
              </div>
            )}
          </section>

          <section className="form-section">
            <h2>Invoice Items</h2>
            <div className="items-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>HSN Code</th>
                    <th>Quantity</th>
                    <th>Rate (Rs)</th>
                    <th>Amount (Rs)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.product}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {products.map((product, productIndex) => {
                            const productField = productHeaders[0] || 'Product Name';
                            const productName =
                              product[productField] ||
                              product['Product Name'] ||
                              `Product ${productIndex}`;
                            return (
                              <option key={productIndex} value={productName}>
                                {productName}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        <input type="text" value={item.hsn} readOnly />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        />
                      </td>
                      <td className="amount">Rs {(item.qty * item.rate).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveItem(index)}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn-secondary" onClick={handleAddItem}>
                + Add Item
              </button>
            </div>
          </section>

          <section className="form-section">
            <h2>Transport Details (Optional)</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Transport Mode</label>
                <input
                  type="text"
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  placeholder="e.g., Truck, Rail"
                />
              </div>
              <div className="form-group">
                <label>Vehicle Number</label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="e.g., MH40AB1234"
                />
              </div>
              <div className="form-group">
                <label>Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Nagpur"
                />
              </div>
            </div>
          </section>

          <section className="form-section totals-section">
            <h2>Invoice Summary</h2>
            <div className="totals-grid">
              <div className="total-item">
                <span>Taxable Value:</span>
                <strong>Rs {totals.taxable.toFixed(2)}</strong>
              </div>
              {customerState === 'Maharashtra' ? (
                <>
                  <div className="total-item">
                    <span>SGST (2.5%):</span>
                    <strong>Rs {totals.sgst.toFixed(2)}</strong>
                  </div>
                  <div className="total-item">
                    <span>CGST (2.5%):</span>
                    <strong>Rs {totals.cgst.toFixed(2)}</strong>
                  </div>
                </>
              ) : (
                <div className="total-item">
                  <span>IGST (5%):</span>
                  <strong>Rs {totals.igst.toFixed(2)}</strong>
                </div>
              )}
              <div className="total-item grand-total">
                <span>Grand Total:</span>
                <strong>Rs {totals.grand.toFixed(2)}</strong>
              </div>
            </div>
          </section>

          <section className="form-section actions-section">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create and Download Invoice'}
            </button>
            {invoiceNumber && (
              <button type="button" className="btn-secondary" onClick={printInvoice}>
                Print or Download
              </button>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}

export default Invoice;
