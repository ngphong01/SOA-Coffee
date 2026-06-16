import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import PrivateRoute from './components/PrivateRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import ProductListPage from './pages/products/ProductListPage';
import ProductFormPage from './pages/products/ProductFormPage';
import CategoryListPage from './pages/categories/CategoryListPage';
import InventoryPage from './pages/inventory/InventoryPage';
import InventoryImportPage from './pages/inventory/InventoryImportPage';
import InventoryTransactionsPage from './pages/inventory/InventoryTransactionsPage';
import InventoryAlertsPage from './pages/inventory/InventoryAlertsPage';
import InventoryDetailPage from './pages/inventory/InventoryDetailPage';
import OrderListPage from './pages/orders/OrderListPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import CreateOrderPage from './pages/orders/OrderCreatePage';
import PaymentListPage from './pages/payments/PaymentListPage';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import SalesAnalyticsPage from './pages/analytics/SalesAnalyticsPage';
import RevenueAnalyticsPage from './pages/analytics/RevenueAnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/create" element={<ProductFormPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/import" element={<InventoryImportPage />} />
        <Route path="/inventory/transactions" element={<InventoryTransactionsPage />} />
        <Route path="/inventory/alerts" element={<InventoryAlertsPage />} />
        <Route path="/inventory/:id" element={<InventoryDetailPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/create" element={<CreateOrderPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/payments" element={<PaymentListPage />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/analytics/sales" element={<SalesAnalyticsPage />} />
        <Route path="/analytics/revenue" element={<RevenueAnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
