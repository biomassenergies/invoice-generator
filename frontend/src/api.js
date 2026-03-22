import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api'
});

// Customers
export const getCustomers = () => API.get('/customers');

// Products
export const getProducts = () => API.get('/products');
export const listInvoices = () => API.get('/invoices');
export const getDashboard = (params) => API.get('/dashboard', { params });

// Invoice operations
export const createInvoice = (data) => API.post('/create-invoice', data);
export const getInvoice = (invoiceNumber) =>
  API.get(`/invoice/${encodeURIComponent(invoiceNumber)}`);
export const downloadInvoicePDF = (invoiceNumber) => 
  API.get(`/invoice/${encodeURIComponent(invoiceNumber)}/pdf`, { responseType: 'blob' });

// Health check
export const checkHealth = () => API.get('/health');

export default API;
