import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { authAPI } from '../../api/auth.api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Vui lòng nhập email');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch {
      toast.error('Không gửi được email đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-900 via-coffee-800 to-coffee-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-coffee-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl mb-5 shadow-glow border border-white/10">
            <Coffee size={40} className="text-coffee-200" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Quán Cà Phê</h1>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-white/20">
          {sent ? (
            <div className="text-center py-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-coffee-900 mb-2">Kiểm tra email của bạn</h2>
              <p className="text-coffee-500 text-sm mb-6">Chúng tôi đã gửi link đặt lại mật khẩu đến <strong className="text-coffee-700">{email}</strong></p>
              <Link to="/login" className="btn-primary w-full justify-center py-3">Quay lại đăng nhập</Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-coffee-900">Quên mật khẩu?</h2>
                <p className="text-coffee-500 text-sm mt-1">Nhập email để nhận link đặt lại mật khẩu</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="form-label">Địa chỉ email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@coffeeshop.com" className="form-input pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                  {loading ? <><Loader2 size={20} className="animate-spin" /> Đang gửi...</> : 'Gửi link đặt lại'}
                </button>
              </form>
              <Link to="/login" className="flex items-center justify-center gap-2 mt-5 text-sm text-coffee-500 hover:text-coffee-700 transition-colors">
                <ArrowLeft size={14} /> Quay lại đăng nhập
              </Link>
            </>
          )}
        </div>
        <p className="text-center text-coffee-400 text-xs mt-6">
          © 2026 Quán Cà Phê Management System
        </p>
      </div>
    </div>
  );
}
