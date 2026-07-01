import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './components/layouts/DashboardLayout';
import CustomerLayout from './components/layouts/CustomerLayout';
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
import OrderListPage from './pages/admin/OrderListPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import CreateOrderPage from './pages/orders/OrderCreatePage';
import PaymentListPage from './pages/payments/PaymentListPage';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import SalesAnalyticsPage from './pages/analytics/SalesAnalyticsPage';
import RevenueAnalyticsPage from './pages/analytics/RevenueAnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import VoucherListPage from './pages/vouchers/VoucherListPage';

// Customer pages
import HomePage from './pages/customer/HomePage';
import MenuPage from './pages/customer/MenuPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import CustomerOrderDetailPage from './pages/customer/OrderDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import WishlistPage from './pages/customer/WishlistPage';
import PromotionsPage from './pages/customer/PromotionsPage';
import StoresPage from './pages/customer/StoresPage';
import AboutPage from './pages/customer/AboutPage';
import ContactPage from './pages/customer/ContactPage';

export default function App() {
  return (
    <Routes>
      {/* === CUSTOMER WEBSITE === */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Protected customer routes */}
        <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} />
        <Route path="/my-orders/:id" element={<PrivateRoute><CustomerOrderDetailPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
      </Route>

      {/* Auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* === ADMIN DASHBOARD === */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/create" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/import" element={<InventoryImportPage />} />
        <Route path="inventory/transactions" element={<InventoryTransactionsPage />} />
        <Route path="inventory/alerts" element={<InventoryAlertsPage />} />
        <Route path="inventory/:id" element={<InventoryDetailPage />} />
        <Route path="orders" element={<OrderListPage />} />
        <Route path="orders/create" element={<CreateOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="payments" element={<PaymentListPage />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="analytics/sales" element={<SalesAnalyticsPage />} />
        <Route path="analytics/revenue" element={<RevenueAnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="vouchers" element={<VoucherListPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
