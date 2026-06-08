import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../api/orders.api.js';
import toast from 'react-hot-toast';

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await ordersAPI.getAll(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await ordersAPI.getOne(id);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createOrder = createAsyncThunk('orders/create', async (data, { rejectWithValue }) => {
  try {
    const res = await ordersAPI.create(data);
    toast.success('Order created!');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status, cancel_reason }, { rejectWithValue }) => {
    try {
      const res = await ordersAPI.updateStatus(id, { status, cancel_reason });
      toast.success(`Order ${status}`);
      return res.data.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message); }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    currentOrder: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading: false,
    error: null,
    filters: { status: '', type: '', date_from: '', date_to: '' },
  },
  reducers: {
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearCurrentOrder: (state) => { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.meta?.pagination || state.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => { state.currentOrder = action.payload; })
      .addCase(createOrder.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentOrder?.id === action.payload.id) state.currentOrder = action.payload;
      });
  },
});

export const { setFilters, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
