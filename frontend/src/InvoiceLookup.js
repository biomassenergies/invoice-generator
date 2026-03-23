import React, { useEffect, useState } from 'react';
import { downloadInvoicePDF, getInvoice, listInvoices } from './api';
import './InvoiceLookup.css';

const InvoiceLookup = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listInvoices();
      setInvoices(response.data || []);
    } catch (err) {
      setError('Failed to fetch invoices: ' + (err.response?.data?.details || err.message));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceNumber) => {
    try {
      setLoading(true);
      setError('');
      const response = await getInvoice(invoiceNumber);
      setInvoiceDetails(response.data);
    } catch (err) {
      setError('Failed to fetch invoice details: ' + (err.response?.data?.details || err.message));
      setInvoiceDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invoiceNumber) => {
    setSelectedInvoice(invoiceNumber);
    setMobileDetailsOpen(true);
    fetchInvoiceDetails(invoiceNumber);
  };

  const filteredInvoices = invoices.filter(invoiceNumber =>
    invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    const numeric = Number(String(value ?? 0).replace(/,/g, ''));
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    return `Rs ${safeValue.toFixed(2)}`;
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      const response = await downloadInvoicePDF(selectedInvoice);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${selectedInvoice}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF: ' + (err.response?.data?.details || err.message));
    }
  };

  const handlePrint = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      const response = await downloadInvoicePDF(selectedInvoice);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const newWindow = window.open(url);
      if (newWindow) {
        newWindow.print();
      }
    } catch (err) {
      setError('Failed to print: ' + (err.response?.data?.details || err.message));
    }
  };

  return (
    <div className="invoice-lookup-container">
      <div className="lookup-header">
        <h1>Invoice Lookup</h1>
        <p>Search and view your invoices</p>
      </div>

      <div className="lookup-content">
        <div className="invoice-list-panel">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="invoice-list">
            {loading && <p className="loading-text">Loading invoices...</p>}
            {!loading && filteredInvoices.length === 0 ? (
              <p className="no-data">No invoices found</p>
            ) : (
              filteredInvoices.map((invoiceNumber) => (
                <div
                  key={invoiceNumber}
                  className={`invoice-item ${selectedInvoice === invoiceNumber ? 'active' : ''}`}
                  onClick={() => handleSelectInvoice(invoiceNumber)}
                >
                  <div className="invoice-item-number">{invoiceNumber}</div>
                  <div className="invoice-item-arrow">{'>'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="invoice-details-panel">
          <button
            type="button"
            className="mobile-back-btn"
            onClick={() => setMobileDetailsOpen(false)}
          >
            Back to Invoice List
          </button>
          {selectedInvoice ? (
            <>
              <div className="details-header">
                <h2>Invoice Details</h2>
                <div className="action-buttons">
                  <button className="btn-download" onClick={handleDownloadPDF}>
                    Download PDF
                  </button>
                  <button className="btn-print" onClick={handlePrint}>
                    Print
                  </button>
                </div>
              </div>

              {invoiceDetails && (
                <div className="invoice-details">
                  <div className="details-section">
                    <h3>Invoice Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Invoice Number:</span>
                      <span className="detail-value">{invoiceDetails.invoiceNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{invoiceDetails.date}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Customer Details</h3>
                    <div className="detail-row">
                      <span className="detail-label">Consignee Name:</span>
                      <span className="detail-value">{invoiceDetails.consigneeName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Buyer:</span>
                      <span className="detail-value">{invoiceDetails.buyer}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Items</h3>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>HSN Code</th>
                          <th>Qty</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoiceDetails.items || []).map((item, idx) => (
                          <tr key={`${item.product}-${idx}`}>
                            <td>{item.product}</td>
                            <td>{item.hsn}</td>
                            <td>{item.qty}</td>
                            <td>{formatCurrency(item.rate)}</td>
                            <td>{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="details-section total-section">
                    <div className="detail-row total-row">
                      <span className="total-label">Grand Total:</span>
                      <span className="total-value">{formatCurrency(invoiceDetails.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Select an invoice to view details</p>
            </div>
          )}
        </div>
      </div>

      {selectedInvoice ? (
        <button
          type="button"
          className="mobile-details-launcher"
          onClick={() => setMobileDetailsOpen(true)}
        >
          View Selected Invoice
        </button>
      ) : null}

      {mobileDetailsOpen && selectedInvoice ? (
        <div className="mobile-details-backdrop" onClick={() => setMobileDetailsOpen(false)}>
          <div className="mobile-details-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-details-sheet__header">
              <strong>{selectedInvoice}</strong>
              <button
                type="button"
                className="mobile-sheet-close"
                onClick={() => setMobileDetailsOpen(false)}
              >
                x
              </button>
            </div>
            <div className="mobile-details-sheet__body">
              <div className="invoice-details-panel invoice-details-panel--mobile">
                <div className="details-header">
                  <h2>Invoice Details</h2>
                  <div className="action-buttons">
                    <button className="btn-download" onClick={handleDownloadPDF}>
                      Download PDF
                    </button>
                    <button className="btn-print" onClick={handlePrint}>
                      Print
                    </button>
                  </div>
                </div>

                {invoiceDetails ? (
                  <div className="invoice-details">
                    <div className="details-section">
                      <h3>Invoice Information</h3>
                      <div className="detail-row">
                        <span className="detail-label">Invoice Number:</span>
                        <span className="detail-value">{invoiceDetails.invoiceNumber}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{invoiceDetails.date}</span>
                      </div>
                    </div>

                    <div className="details-section">
                      <h3>Customer Details</h3>
                      <div className="detail-row">
                        <span className="detail-label">Consignee Name:</span>
                        <span className="detail-value">{invoiceDetails.consigneeName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Buyer:</span>
                        <span className="detail-value">{invoiceDetails.buyer}</span>
                      </div>
                    </div>

                    <div className="details-section">
                      <h3>Items</h3>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>HSN Code</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(invoiceDetails.items || []).map((item, idx) => (
                            <tr key={`${item.product}-${idx}`}>
                              <td>{item.product}</td>
                              <td>{item.hsn}</td>
                              <td>{item.qty}</td>
                              <td>{formatCurrency(item.rate)}</td>
                              <td>{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="details-section total-section">
                      <div className="detail-row total-row">
                        <span className="total-label">Grand Total:</span>
                        <span className="total-value">{formatCurrency(invoiceDetails.total)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="loading-text">Loading invoice details...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default InvoiceLookup;
