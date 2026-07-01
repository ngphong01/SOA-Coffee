import React, { useState, useEffect } from 'react';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';
import { Ticket, Plus, Edit, Trash2, X, Save, Search } from "../../utils/icons";

const vnd = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const initialForm = { code: '', type: 'percentage', value: 10, min_order_value: 0, max_usage: 100, expires_at: '', is_active: true, description: '' };

export default function VoucherListPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vouchers?limit=100');
      setVouchers(res.data.data?.data || res.data.data || []);
    } catch {
      // Mock data fallback
      setVouchers([
        { id: 1, code: 'COFFEE10', type: 'percentage', value: 10, min_order_value: 50000, max_usage: 100, used_count: 23, expires_at: '2026-12-31', is_active: true, description: 'Giảm 10% cho đơn từ 50K' },
        { id: 2, code: 'WELCOME20', type: 'percentage', value: 20, min_order_value: 100000, max_usage: 50, used_count: 8, expires_at: '2026-07-15', is_active: true, description: 'Chào mừng giảm 20%' },
        { id: 3, code: 'FREESHIP', type: 'fixed', value: 15000, min_order_value: 0, max_usage: 200, used_count: 67, expires_at: '2026-08-01', is_active: true, description: 'Miễn phí giao hàng' },
        { id: 4, code: 'SUMMER50', type: 'fixed', value: 50000, min_order_value: 200000, max_usage: 30, used_count: 30, expires_at: '2026-06-01', is_active: false, description: 'Giảm 50K mùa hè - Đã hết' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const openEdit = (voucher) => {
    setEditing(voucher);
    setForm({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      min_order_value: voucher.min_order_value || 0,
      max_usage: voucher.max_usage || 100,
      expires_at: voucher.expires_at ? voucher.expires_at.split('T')[0] : '',
      is_active: voucher.is_active,
      description: voucher.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/vouchers/${editing.id}`, form);
        toast.success('Cập nhật voucher thành công!');
      } else {
        await api.post('/vouchers', form);
        toast.success('Tạo voucher mới thành công!');
      }
      closeForm();
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (voucher) => {
    if (!window.confirm(`Xóa voucher "${voucher.code}"?`)) return;
    try {
      await api.delete(`/vouchers/${voucher.id}`);
      toast.success('Đã xóa voucher');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const filtered = vouchers.filter(v =>
    v.code?.toLowerCase().includes(search.toLowerCase()) ||
    v.description?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.is_active).length,
    used: vouchers.reduce((s, v) => s + (v.used_count || 0), 0),
    expiring: vouchers.filter(v => v.is_active && v.expires_at && new Date(v.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-coffee-900 flex items-center gap-2">
            <Ticket size={22} className="text-amber-500" />
            Quản lý Voucher
          </h1>
          <p className="text-sm text-coffee-500 mt-0.5">Tạo và quản lý mã giảm giá cho khách hàng</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-5 py-2.5 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-amber-200"
        >
          <Plus size={18} />
          Tạo voucher
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng voucher', value: stats.total, icon: Ticket, color: 'bg-amber-500' },
          { label: 'Đang hoạt động', value: stats.active, icon: Ticket, color: 'bg-emerald-500' },
          { label: 'Đã sử dụng', value: stats.used, icon: Ticket, color: 'bg-blue-500' },
          { label: 'Sắp hết hạn', value: stats.expiring, icon: Ticket, color: 'bg-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon size={14} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm voucher theo mã hoặc mô tả..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition bg-white"
        />
      </div>

      {/* Voucher Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Mã</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Loại</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Giá trị</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Đơn tối thiểu</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Đã dùng / Tối đa</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Hết hạn</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Trạng thái</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Mô tả</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-amber-50/50 transition">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-amber-600 text-sm font-mono tracking-wider">{v.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      v.type === 'percentage' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600'
                    }`}>
                      {v.type === 'percentage' ? '% Phần trăm' : '💰 Cố định'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-gray-800 text-sm">
                      {v.type === 'percentage' ? `${v.value}%` : vnd(v.value)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{vnd(v.min_order_value || 0)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    <span className={v.used_count >= v.max_usage ? 'text-red-500 font-semibold' : ''}>
                      {v.used_count || 0}
                    </span>
                    <span className="text-gray-300"> / {v.max_usage || '∞'}</span>
                    {v.used_count >= v.max_usage && (
                      <span className="ml-2 text-xs text-red-400">(hết lượt)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {v.expires_at ? (
                      <span className={`text-xs font-semibold ${
                        new Date(v.expires_at) < new Date() ? 'text-red-500' :
                        new Date(v.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-500' :
                        'text-gray-500'
                      }`}>
                        {new Date(v.expires_at).toLocaleDateString('vi-VN')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Không giới hạn</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      v.is_active
                        ? new Date(v.expires_at) < new Date()
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        v.is_active && new Date(v.expires_at) >= new Date() ? 'bg-emerald-500' : 'bg-gray-400'
                      }`} />
                      {!v.is_active ? 'Đã tắt' :
                       new Date(v.expires_at) < new Date() ? 'Hết hạn' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">{v.description}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(v)}
                        className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 hover:bg-amber-100 transition"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    {search ? 'Không tìm thấy voucher phù hợp' : 'Chưa có voucher nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? 'Chỉnh sửa voucher' : 'Tạo voucher mới'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Mã voucher</label>
                <input
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="VD: COFFEE10"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-mono font-bold tracking-wider focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition uppercase"
                  disabled={!!editing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Loại giảm giá</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                    {form.type === 'percentage' ? 'Phần trăm giảm' : 'Số tiền giảm'}
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min={1}
                      max={form.type === 'percentage' ? 100 : 999999999}
                      value={form.value}
                      onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">
                      {form.type === 'percentage' ? '%' : '₫'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Đơn tối thiểu</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={form.min_order_value}
                      onChange={e => setForm({ ...form, min_order_value: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₫</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_usage}
                    onChange={e => setForm({ ...form, max_usage: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Ngày hết hạn</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Mô tả</label>
                <input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về voucher"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-2xl">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-sm font-semibold text-gray-700">Kích hoạt voucher</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
