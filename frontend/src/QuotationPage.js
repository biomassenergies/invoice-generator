import React, { useEffect, useState } from 'react';
import { downloadQuotationPDF, getProducts, listQuotations } from './api';
import './QuotationPage.css';

const today = new Date().toISOString().split('T')[0];

const initialRecipient = {
  companyName: '',
  gstin: '',
  address: ''
};

const initialNotes = {
  transportNote:
    'Rate quoted above is exclusive of transport cost and loading/unloading charges (delivery and handling by us).',
  deliveryLeadTime:
    'The order must be raised not less than 3 day(s) before the delivery date.',
  paymentTerms:
    'Payment to be made within 6 to 15 days from PO Release Date (OR) mutually agreed site terms.',
  additionalNotes: ''
};

function sanitizeFilenamePart(value, fallback) {
  return (
    String(value || '')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || fallback
  );
}

function buildQuoteNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  return `QT-${stamp}`;
}

function QuotationPage() {
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [productHeaders, setProductHeaders] = useState([]);
  const [quotationHistory, setQuotationHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');
  const [quoteNumber, setQuoteNumber] = useState(buildQuoteNumber());
  const [quoteDate, setQuoteDate] = useState(today);
  const [discussionDate, setDiscussionDate] = useState(today);
  const [recipient, setRecipient] = useState(initialRecipient);
  const [notes, setNotes] = useState(initialNotes);
  const [items, setItems] = useState([{ product: '', quantity: 1, unitRate: 0 }]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const [productResponse, quotationResponse] = await Promise.all([
          getProducts(),
          listQuotations()
        ]);
        setProductHeaders(productResponse.data?.headers || []);
        setProducts(productResponse.data?.data || []);
        setQuotationHistory(quotationResponse.data || []);
      } catch (err) {
        setError('Unable to load product master or quotation history');
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const getProductNameField = () => productHeaders[0] || 'Product Name';

  const getProductRateField = () =>
    productHeaders.find((header) => header.toLowerCase().includes('rate')) || 'Rate';

  const handleRecipientChange = (field, value) => {
    setRecipient((current) => ({ ...current, [field]: value }));
  };

  const handleNotesChange = (field, value) => {
    setNotes((current) => ({ ...current, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const nextItems = [...items];
    nextItems[index][field] = value;

    if (field === 'product') {
      const productNameField = getProductNameField();
      const rateField = getProductRateField();
      const selectedProduct = products.find(
        (entry) =>
          String(entry[productNameField] || entry['Product Name'] || '').trim() === value
      );

      if (selectedProduct) {
        nextItems[index].unitRate = Number(selectedProduct[rateField] || selectedProduct.Rate || 0);
      }
    }

    if (field === 'quantity' || field === 'unitRate') {
      nextItems[index][field] = Number(value || 0);
    }

    setItems(nextItems);
  };

  const handleAddItem = () => {
    setItems((current) => [...current, { product: '', quantity: 1, unitRate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitRate || 0),
    0
  );
  const filteredHistory = quotationHistory.filter((entry) => {
    const query = historyFilter.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      String(entry.quoteNumber || '').toLowerCase().includes(query) ||
      String(entry.companyName || '').toLowerCase().includes(query)
    );
  });

  const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!recipient.companyName.trim()) {
      setError('Please enter the company name for the quotation');
      return;
    }

    const normalizedItems = items.filter((item) => String(item.product || '').trim());
    if (!normalizedItems.length) {
      setError('Please add at least one quoted product');
      return;
    }

    const payload = {
      quoteNumber,
      quoteDate,
      discussionDate,
      recipient,
      notes,
      items: normalizedItems
    };

    try {
      setLoading(true);
      const response = await downloadQuotationPDF(payload);
      const fileName = `Quotation - ${sanitizeFilenamePart(
        recipient.companyName,
        'Customer'
      )}.pdf`;
      downloadBlob(response.data, fileName);
      setSuccess(`Quotation ready for ${recipient.companyName}`);
      setQuoteNumber(buildQuoteNumber());
      const historyResponse = await listQuotations();
      setQuotationHistory(historyResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating quotation PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quotation-page">
      <div className="quotation-shell">
        <header className="quotation-header">
          <p className="quotation-kicker">Owner Workspace</p>
          <h1>Create Quotation</h1>
          <p>Prepare a polished commercial quotation with product selections, rates, and standard terms.</p>
        </header>

        <section className="quotation-history-card">
          <div className="quotation-section-head">
            <div>
              <h2>Recent Quotations</h2>
              <p>Saved quotations from your quotation register stay visible here for quick reference.</p>
            </div>
            <input
              type="text"
              className="quotation-history-search"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              placeholder="Search by quote number or company"
            />
          </div>
          {filteredHistory.length ? (
            <div className="quotation-history-list">
              {filteredHistory.slice(0, 8).map((entry) => (
                <article key={entry.quoteNumber} className="quotation-history-item">
                  <strong>{entry.quoteNumber}</strong>
                  <span>{entry.companyName}</span>
                  <small>{entry.quoteDate || 'No date'} | Rs {Number(entry.grandTotal || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</small>
                </article>
              ))}
            </div>
          ) : (
            <p className="quotation-history-empty">No saved quotations found yet.</p>
          )}
        </section>

        <form className="quotation-form" onSubmit={handleSubmit}>
          {error ? <div className="quotation-alert error">{error}</div> : null}
          {success ? <div className="quotation-alert success">{success}</div> : null}

          <section className="quotation-section">
            <h2>Quotation Details</h2>
            <div className="quotation-grid">
              <label>
                <span>Quotation Number</span>
                <input type="text" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} />
              </label>
              <label>
                <span>Quotation Date</span>
                <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
              </label>
              <label>
                <span>Discussion Date</span>
                <input
                  type="date"
                  value={discussionDate}
                  onChange={(e) => setDiscussionDate(e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="quotation-section">
            <h2>To</h2>
            <div className="quotation-grid">
              <label>
                <span>Company Name *</span>
                <input
                  type="text"
                  value={recipient.companyName}
                  onChange={(e) => handleRecipientChange('companyName', e.target.value)}
                  required
                />
              </label>
              <label>
                <span>GSTIN</span>
                <input
                  type="text"
                  value={recipient.gstin}
                  onChange={(e) => handleRecipientChange('gstin', e.target.value)}
                />
              </label>
              <label className="quotation-span-2">
                <span>Address</span>
                <textarea
                  rows="3"
                  value={recipient.address}
                  onChange={(e) => handleRecipientChange('address', e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="quotation-section">
            <div className="quotation-section-head">
              <div>
                <h2>Quoted Products</h2>
                <p>Select from your product master and refine the commercial rate as needed.</p>
              </div>
              <button type="button" className="quotation-secondary-btn" onClick={handleAddItem}>
                + Add Product
              </button>
            </div>

            <div className="quotation-table-wrap">
              <table className="quotation-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Rate</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.product}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          disabled={loadingProducts}
                        >
                          <option value="">{loadingProducts ? 'Loading products...' : 'Select product'}</option>
                          {products.map((product, productIndex) => {
                            const field = getProductNameField();
                            const productName =
                              product[field] || product['Product Name'] || `Product ${productIndex + 1}`;
                            return (
                              <option key={`${productName}-${productIndex}`} value={productName}>
                                {productName}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitRate}
                          onChange={(e) => handleItemChange(index, 'unitRate', e.target.value)}
                        />
                      </td>
                      <td className="quotation-total-cell">
                        Rs {(Number(item.quantity || 0) * Number(item.unitRate || 0)).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="quotation-remove-btn"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="quotation-grand-total">
              <span>Total Quote</span>
              <strong>
                Rs{' '}
                {grandTotal.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </strong>
            </div>
          </section>

          <section className="quotation-section">
            <h2>Commercial Notes</h2>
            <div className="quotation-grid">
              <label className="quotation-span-2">
                <span>Transport Note</span>
                <textarea
                  rows="2"
                  value={notes.transportNote}
                  onChange={(e) => handleNotesChange('transportNote', e.target.value)}
                />
              </label>
              <label>
                <span>Delivery Commitment</span>
                <input
                  type="text"
                  value={notes.deliveryLeadTime}
                  onChange={(e) => handleNotesChange('deliveryLeadTime', e.target.value)}
                />
              </label>
              <label>
                <span>Payment Terms</span>
                <input
                  type="text"
                  value={notes.paymentTerms}
                  onChange={(e) => handleNotesChange('paymentTerms', e.target.value)}
                />
              </label>
              <label className="quotation-span-2">
                <span>Additional Notes</span>
                <textarea
                  rows="3"
                  value={notes.additionalNotes}
                  onChange={(e) => handleNotesChange('additionalNotes', e.target.value)}
                  placeholder="Optional project, supply, or pricing notes"
                />
              </label>
            </div>
          </section>

          <section className="quotation-actions">
            <button type="submit" className="quotation-primary-btn" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Quotation PDF'}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}

export default QuotationPage;
