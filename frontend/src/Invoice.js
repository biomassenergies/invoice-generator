import React, { useEffect, useState } from 'react';
import {
  getCustomers,
  getProducts,
  createInvoice,
  downloadInvoicePDF,
  getInvoiceSuggestions
} from './api';
import './Invoice.css';

function Invoice() {
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerHeaders, setCustomerHeaders] = useState([]);
  const [productHeaders, setProductHeaders] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerState, setCustomerState] = useState('');
  const [buyer, setBuyer] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [supplierRef, setSupplierRef] = useState('');
  const [otherReference, setOtherReference] = useState('');
  const [buyerOrderNo, setBuyerOrderNo] = useState('');
  const [buyerOrderDate, setBuyerOrderDate] = useState('');
  const [despatchDocumentNo, setDespatchDocumentNo] = useState('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState('');
  const [billOfLading, setBillOfLading] = useState('');
  const [transport, setTransport] = useState('');
  const [transportValue, setTransportValue] = useState(0);
  const [vehicle, setVehicle] = useState('');
  const [destination, setDestination] = useState('');
  const [items, setItems] = useState([{ product: '', hsn: '', qty: 1, rate: 0, per: 'unit' }]);
  const [totals, setTotals] = useState({
    taxable: 0,
    sgst: 0,
    cgst: 0,
    igst: 0,
    transportValue: 0,
    grand: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const getCustomerNameField = () =>
    customerHeaders.find((header) => header.toLowerCase().includes('name')) || 'Customer Name';

  const getCustomerStateField = () =>
    customerHeaders.find((header) => header.toLowerCase().includes('state')) || 'State';

  const getCustomerCodeField = () =>
    customerHeaders.find((header) => header.toLowerCase().includes('code')) || 'CODE';

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

  const calculateTotals = (
    itemsList,
    stateValue = customerState,
    transportCostValue = transportValue
  ) => {
    let taxable = 0;
    let sgst = 0;
    let cgst = 0;
    let igst = 0;
    const normalizedState = String(stateValue || '').trim().toUpperCase();
    const normalizedTransportValue = Number(transportCostValue || 0);

    itemsList.forEach((item) => {
      const amount = item.qty * item.rate;
      taxable += amount;

      if (normalizedState === 'MAHARASHTRA') {
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
      transportValue: normalizedTransportValue,
      grand: taxable + sgst + cgst + igst + normalizedTransportValue
    });
  };

  const loadSuggestions = async (customer) => {
    if (!customer) {
      setSuggestions(null);
      return;
    }

    const codeField = getCustomerCodeField();
    const nameField = getCustomerNameField();
    const customerCode = customer[codeField] || customer.CODE || '';
    const customerName = customer[nameField] || customer['Customer Name'] || '';

    if (!customerCode && !customerName) {
      setSuggestions(null);
      return;
    }

    try {
      setSuggestionsLoading(true);
      const response = await getInvoiceSuggestions({
        customerCode,
        customerName,
        date: today
      });
      const nextSuggestions = response.data;
      setSuggestions(nextSuggestions);
      setInvoiceNumber(nextSuggestions.suggestedInvoiceNumber || '');
      setDespatchDocumentNo(nextSuggestions.suggestedDespatchDocumentNo || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load invoice suggestions');
      setSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleCustomerChange = async (e) => {
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
      setBuyer(customerName);
      calculateTotals(items, state, transportValue);
      await loadSuggestions(customer);
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
    calculateTotals(updated, customerState, transportValue);
  };

  const handleAddItem = () => {
    const updated = [...items, { product: '', hsn: '', qty: 1, rate: 0, per: 'unit' }];
    setItems(updated);
    calculateTotals(updated, customerState, transportValue);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(updated);
    calculateTotals(updated, customerState, transportValue);
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
        buyer: buyer || consigneeName,
        date: today,
        deliveryNote,
        paymentTerms,
        supplierRef,
        otherReference,
        buyerOrderNo,
        buyerOrderDate,
        despatchDocumentNo,
        deliveryNoteDate,
        billOfLading,
        customerState,
        items: items.map((item) => ({
          product: item.product,
          hsn: item.hsn || '',
          qty: item.qty,
          rate: item.rate,
          per: item.per || 'unit'
        })),
        transport,
        transportValue: Number(transportValue || 0),
        vehicle,
        destination
      };

      await createInvoice(payload);
      setSuccess(`Invoice ${invoiceNumber} created successfully!`);

      setInvoiceNumber('');
      setSelectedCustomer(null);
      setCustomerState('');
      setBuyer('');
      setDeliveryNote('');
      setPaymentTerms('');
      setSupplierRef('');
      setOtherReference('');
      setBuyerOrderNo('');
      setBuyerOrderDate('');
      setDespatchDocumentNo('');
      setDeliveryNoteDate('');
      setBillOfLading('');
      setItems([{ product: '', hsn: '', qty: 1, rate: 0, per: 'unit' }]);
      setTransport('');
      setTransportValue(0);
      setVehicle('');
      setDestination('');
      setSuggestions(null);
      setTotals({ taxable: 0, sgst: 0, cgst: 0, igst: 0, transportValue: 0, grand: 0 });

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
                  placeholder="Suggested from customer code and current FY"
                  required
                />
                {suggestions && (
                  <p className="field-hint">
                    Suggested: <strong>{suggestions.suggestedInvoiceNumber}</strong>
                    {suggestions.latestInvoiceNumber
                      ? ` | Last used: ${suggestions.latestInvoiceNumber}`
                      : ' | First invoice for this customer in current FY'}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  defaultValue={today}
                  disabled
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Buyer</label>
                <input
                  type="text"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  placeholder="Buyer name"
                />
              </div>
              <div className="form-group">
                <label>Delivery Note</label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Delivery note"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Mode/Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Payment terms"
                />
              </div>
              <div className="form-group">
                <label>Supplier Ref.</label>
                <input
                  type="text"
                  value={supplierRef}
                  onChange={(e) => setSupplierRef(e.target.value)}
                  placeholder="Supplier reference"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Other Reference(s)</label>
                <input
                  type="text"
                  value={otherReference}
                  onChange={(e) => setOtherReference(e.target.value)}
                  placeholder="Other references"
                />
              </div>
              <div className="form-group">
                <label>Buyer's Order No.</label>
                <input
                  type="text"
                  value={buyerOrderNo}
                  onChange={(e) => setBuyerOrderNo(e.target.value)}
                  placeholder="Buyer order number"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Buyer Order Date</label>
                <input
                  type="date"
                  value={buyerOrderDate}
                  onChange={(e) => setBuyerOrderDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Delivery Note Date</label>
                <input
                  type="date"
                  value={deliveryNoteDate}
                  onChange={(e) => setDeliveryNoteDate(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Despatch Document No.</label>
                <input
                  type="text"
                  value={despatchDocumentNo}
                  onChange={(e) => setDespatchDocumentNo(e.target.value)}
                  placeholder="Suggested unique despatch document number"
                />
                {suggestions && (
                  <p className="field-hint">
                    Suggested: <strong>{suggestions.suggestedDespatchDocumentNo}</strong>
                    {suggestions.latestDespatchDocumentNo
                      ? ` | Last used: ${suggestions.latestDespatchDocumentNo}`
                      : ' | Starting a new despatch series'}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Bill of Landing/LR-RR No.</label>
                <input
                  type="text"
                  value={billOfLading}
                  onChange={(e) => setBillOfLading(e.target.value)}
                  placeholder="Bill or LR-RR number"
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
                {suggestionsLoading && <p className="field-hint">Loading numbering suggestions...</p>}
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  GST Type:{' '}
                  {String(customerState || '').trim().toUpperCase() === 'MAHARASHTRA'
                    ? 'CGST + SGST'
                    : 'IGST'}
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
                    <th>Per</th>
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
                      <td>
                        <input
                          type="text"
                          value={item.per}
                          onChange={(e) => handleItemChange(index, 'per', e.target.value)}
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
                <label>Despatch through</label>
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
              <div className="form-group">
                <label>Transport Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={transportValue}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value || 0);
                    setTransportValue(nextValue);
                    calculateTotals(items, customerState, nextValue);
                  }}
                  placeholder="Optional transport charge"
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
              <div className="total-item">
                <span>SGST (2.5%):</span>
                <strong>Rs {totals.sgst.toFixed(2)}</strong>
              </div>
              <div className="total-item">
                <span>CGST (2.5%):</span>
                <strong>Rs {totals.cgst.toFixed(2)}</strong>
              </div>
              <div className="total-item">
                <span>IGST (5%):</span>
                <strong>Rs {totals.igst.toFixed(2)}</strong>
              </div>
              <div className="total-item">
                <span>Transport Cost:</span>
                <strong>Rs {totals.transportValue.toFixed(2)}</strong>
              </div>
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
