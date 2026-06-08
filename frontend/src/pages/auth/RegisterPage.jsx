import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Coffee, Loader2, User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../api/auth.api';
import toast from 'react-hot-toast';

const schema = yup.object({
  full_name: yup.string().min(2).max(150).required('Vui lòng nhập họ tên'),
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Phải có chữ hoa, chữ thường và số')
    .required('Vui lòng nhập mật khẩu'),
  confirm_password: yup.string()
    .oneOf([yup.ref('password')], 'Mật khẩu không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
  phone: yup.string().optional(),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const pwd = watch('password', '');
  const strength = pwd.length === 0 ? 0
    : pwd.length < 6 ? 1
    : pwd.length < 10 ? 2
    : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pwd) ? 4
    : 3;

  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  const strengthBg = ['', 'bg-red-50 border-red-200', 'bg-amber-50 border-amber-200', 'bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-200'];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      toast.success('Tài khoản đã được tạo! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl mb-5 shadow-glow border border-white/10">
            <Coffee size={40} className="text-coffee-200" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Tạo tài khoản
          </h1>
          <p className="text-coffee-300 mt-2 text-sm">
            Tham gia hệ thống Quán Cà Phê ngay hôm nay
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-white/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Họ và tên</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input {...register('full_name')} placeholder="Nguyễn Văn A" className="form-input pl-10" />
              </div>
              {errors.full_name && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input {...register('email')} type="email" placeholder="you@coffeeshop.com" className="form-input pl-10" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Số điện thoại (không bắt buộc)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input {...register('phone')} placeholder="0901234567" className="form-input pl-10" />
              </div>
            </div>

            <div>
              <label className="form-label">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="form-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwd && (
                <div className={`mt-3 p-3 rounded-xl border ${strengthBg[strength] || 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <ShieldCheck size={12} className={strength >= 3 ? 'text-emerald-500' : 'text-gray-400'} />
                    <p className={`text-xs font-medium ${strength >= 3 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      Độ mạnh: {strengthLabel[strength]}
                    </p>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="form-label">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="form-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Đang tạo tài khoản...</>
              ) : (
                <>Tạo tài khoản <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-coffee-100">
            <p className="text-center text-sm text-coffee-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-coffee-700 font-bold hover:text-coffee-900 transition-colors">
                Đăng nhập
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
