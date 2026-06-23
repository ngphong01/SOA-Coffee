import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../api/analytics.api.js';

const thunk = (name, fn) => createAsyncThunk(name, async (params, { rejectWithValue }) => {
  try { const res = await fn(params); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchDashboard = thunk('analytics/dashboard', () => analyticsAPI.getDashboardSummary());
export const fetchRevenue = thunk('analytics/revenue', (p) => analyticsAPI.getRevenue(p));
export const fetchTopProducts = thunk('analytics/topProducts', (p) => analyticsAPI.getTopProducts(p));
export const fetchPaymentStats = thunk('analytics/paymentStats', () => analyticsAPI.getPaymentStats());
export const fetchCustomerStats = thunk('analytics/customerStats', () => analyticsAPI.getCustomerStats());
export const fetchEmployeeStats = thunk('analytics/employeeStats', () => analyticsAPI.getEmployeeStats());
export const fetchAuthStats = thunk('analytics/authStats', () => analyticsAPI.getAuthStats());
export const fetchCategories = thunk('analytics/categories', () => analyticsAPI.getCategories());

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboard: null, revenue: null, topProducts: [],
    paymentStats: null, customerStats: null, employeeStats: null,
    authStats: null, categories: [],
    loading: false, error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (s) => { s.loading = true; })
      .addCase(fetchDashboard.fulfilled, (s, a) => { s.loading = false; s.dashboard = a.payload; })
      .addCase(fetchDashboard.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchRevenue.fulfilled, (s, a) => { s.revenue = a.payload; })
      .addCase(fetchTopProducts.fulfilled, (s, a) => { s.topProducts = a.payload; })
      .addCase(fetchPaymentStats.fulfilled, (s, a) => { s.paymentStats = a.payload; })
      .addCase(fetchCustomerStats.fulfilled, (s, a) => { s.customerStats = a.payload; })
      .addCase(fetchEmployeeStats.fulfilled, (s, a) => { s.employeeStats = a.payload; })
      .addCase(fetchAuthStats.fulfilled, (s, a) => { s.authStats = a.payload; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; });
  },
});

export default analyticsSlice.reducer;
