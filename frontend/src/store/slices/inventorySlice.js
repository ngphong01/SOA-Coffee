import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryAPI } from '../../api/inventory.api.js';
import toast from 'react-hot-toast';

export const fetchInventory = createAsyncThunk('inventory/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await inventoryAPI.getAll(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchInventoryStats = createAsyncThunk('inventory/fetchStats', async (_, { rejectWithValue }) => {
  try { const res = await inventoryAPI.getStats(); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchLowStockAlerts = createAsyncThunk('inventory/fetchAlerts', async (_, { rejectWithValue }) => {
  try { const res = await inventoryAPI.getLowStockAlerts(); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const importStock = createAsyncThunk('inventory/import', async (data, { rejectWithValue }) => {
  try { const res = await inventoryAPI.importStock(data); toast.success('Stock imported!'); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const adjustStock = createAsyncThunk('inventory/adjust', async (data, { rejectWithValue }) => {
  try { const res = await inventoryAPI.adjustStock(data); toast.success('Stock adjusted!'); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    stats: null,
    alerts: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    alertsLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => { state.loading = true; })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.meta?.pagination || state.pagination;
      })
      .addCase(fetchInventory.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchInventoryStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(fetchLowStockAlerts.pending, (state) => { state.alertsLoading = true; })
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.alertsLoading = false;
        state.alerts = action.payload;
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
