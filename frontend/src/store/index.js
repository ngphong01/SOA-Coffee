    import { configureStore } from '@reduxjs/toolkit';
    import authReducer from './slices/authSlice.js';
    import productReducer from './slices/productSlice.js';
    import orderReducer from './slices/orderSlice.js';
    import inventoryReducer from './slices/inventorySlice.js';
    import analyticsReducer from './slices/analyticsSlice.js';
    import uiReducer from './slices/uiSlice.js';

    export const store = configureStore({
      reducer: {
        auth: authReducer,
        products: productReducer,
        orders: orderReducer,
        inventory: inventoryReducer,
        analytics: analyticsReducer,
        ui: uiReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['persist/PERSIST'],
          },
        }),
      devTools: import.meta.env.MODE !== 'production',
    });

    export default store;
