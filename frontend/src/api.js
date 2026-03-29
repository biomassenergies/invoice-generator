import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  withCredentials: true
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/status');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new CustomEvent('invoice-auth-required'));
    }

    return Promise.reject(error);
  }
);

export const getAuthStatus = () => API.get('/auth/status');
export const login = (password) => API.post('/auth/login', { password });
export const logout = () => API.post('/auth/logout');

// Customers
export const getCustomers = () => API.get('/customers');
export const createCustomer = (data) => API.post('/customers', data);

// Products
export const getProducts = () => API.get('/products');
export const listInvoices = () => API.get('/invoices');
export const listQuotations = () => API.get('/quotations');
export const getDashboard = (params) => API.get('/dashboard', { params });
export const getInvoiceSuggestions = (params) => API.get('/invoice-suggestions', { params });

// Invoice operations
export const createInvoice = (data) => API.post('/create-invoice', data);
export const downloadQuotationPDF = (data) =>
  API.post('/quotation/pdf', data, { responseType: 'blob' });
export const getInvoice = (invoiceNumber) =>
  API.get(`/invoice/${encodeURIComponent(invoiceNumber)}`);
export const downloadInvoicePDF = (invoiceNumber) => 
  API.get(`/invoice/${encodeURIComponent(invoiceNumber)}/pdf`, { responseType: 'blob' });

// Health check
export const checkHealth = () => API.get('/health');

export default API;
