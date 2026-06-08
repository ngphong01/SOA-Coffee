import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, updateUser } from '../store/slices/authSlice';

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const refreshUser = (userData) => {
    dispatch(updateUser(userData));
  };

  const hasRole = (...roles) => roles.includes(user?.role);
  const hasPermission = (permission) => {
    const rolePermissions = {
      super_admin: ['*'],
      admin: ['products.*', 'orders.*', 'inventory.*', 'customers.*', 'analytics.*'],
      manager: ['products.read', 'products.update', 'orders.*', 'inventory.*', 'analytics.read'],
      cashier: ['products.read', 'orders.create', 'orders.read', 'payments.create'],
      barista: ['orders.read'],
      viewer: ['products.read', 'orders.read'],
    };
    const perms = rolePermissions[user?.role] || [];
    return perms.includes('*') || perms.includes(permission)
      || perms.some((p) => p.endsWith('.*') && permission.startsWith(p.replace('.*', '.')));
  };

  return { user, isAuthenticated, loading, handleLogout, refreshUser, hasRole, hasPermission };
};
