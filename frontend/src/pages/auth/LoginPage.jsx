import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Coffee, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { login } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@coffeeshop.com');
  const [password, setPassword] = useState('Admin@123456');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      toast.success('Chào mừng trở lại! ☕');
      navigate('/');
    } else {
      toast.error(result.payload || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-900 via-coffee-800 to-coffee-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-coffee-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-coffee-600/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl mb-5 shadow-glow border border-white/10">
            <Coffee size={40} className="text-coffee-200" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Quán Cà Phê
          </h1>
          <p className="text-coffee-300 mt-2 text-sm">
            Đăng nhập để quản lý cửa hàng của bạn
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-white/20">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  required
                  placeholder="admin@coffeeshop.com"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-coffee-600">Ghi nhớ</span>
              </label>
              <Link to="/forgot-password" className="text-coffee-600 font-medium hover:text-coffee-800 transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Đang đăng nhập...</>
              ) : (
                <>Đăng nhập <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-coffee-100">
            <p className="text-center text-sm text-coffee-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-coffee-700 font-bold hover:text-coffee-900 transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-coffee-400 text-xs mt-6">
          © 2026 Quán Cà Phê Management System
        </p>
      </div>
    </div>
  );
}
