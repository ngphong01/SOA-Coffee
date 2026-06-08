import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../api/analytics.api.js';

export const fetchDashboard = createAsyncThunk('analytics/dashboard', async (_, { rejectWithValue }) => {
  try { const res = await analyticsAPI.getDashboardSummary(); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchRevenue = createAsyncThunk('analytics/revenue', async (params, { rejectWithValue }) => {
  try { const res = await analyticsAPI.getRevenue(params); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchTopProducts = createAsyncThunk('analytics/topProducts', async (params, { rejectWithValue }) => {
  try { const res = await analyticsAPI.getTopProducts(params); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboard: null,
    revenue: null,
    topProducts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.dashboard = action.payload; })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchRevenue.fulfilled, (state, action) => { state.revenue = action.payload; })
      .addCase(fetchTopProducts.fulfilled, (state, action) => { state.topProducts = action.payload; });
  },
});

export default analyticsSlice.reducer;
