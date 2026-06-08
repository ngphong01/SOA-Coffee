import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    modals: {},
    globalLoading: false,
    breadcrumbs: [],
    notifications: [],
    theme: 'light',
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    closeSidebar: (state) => { state.sidebarOpen = false; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    openModal: (state, action) => { state.modals[action.payload] = true; },
    closeModal: (state, action) => { state.modals[action.payload] = false; },
    closeAllModals: (state) => { state.modals = {}; },
    setGlobalLoading: (state, action) => { state.globalLoading = action.payload; },
    setBreadcrumbs: (state, action) => { state.breadcrumbs = action.payload; },
    addNotification: (state, action) => { state.notifications.unshift(action.payload); },
    markNotificationRead: (state, action) => {
      const n = state.notifications.find((x) => x.id === action.payload);
      if (n) n.is_read = true;
    },
    clearNotifications: (state) => { state.notifications = []; },
  },
});

export const {
  toggleSidebar, closeSidebar, setSidebarOpen, openModal, closeModal,
  closeAllModals, setGlobalLoading, setBreadcrumbs,
  addNotification, markNotificationRead, clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
