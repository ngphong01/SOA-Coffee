import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { promotionsAPI } from '../../api/promotions.api';
import DataTable from '../../components/common/DataTable';
import { Gift, Plus, Search, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const PromoStatusBadge = ({ status }) => {
  const map = { active: 'badge-success', upcoming: 'badge-info', expired: 'badge-neutral', inactive: 'badge-neutral' };
  return <span className={map[status] || 'badge-neutral'}>{status}</span>;
};

const PromotionModal = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    starts_at: '',
    ends_at: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        description: initial.description || '',
        type: initial.type || 'percentage',
        value: initial.value ?? '',
        min_order_amount: initial.min_order_amount ?? '',
        max_discount: initial.max_discount ?? '',
        usage_limit: initial.usage_limit ?? '',
        starts_at: initial.starts_at ? String(initial.starts_at).slice(0, 10) : '',
        ends_at: initial.ends_at ? String(initial.ends_at).slice(0, 10) : '',
        status: initial.status || 'active',
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên khuyến mãi');
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      toast.error('Giá trị khuyến mãi không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      };
      if (initial?.id) {
        await promotionsAPI.update(initial.id, payload);
        toast.success('Cập nhật khuyến mãi thành công');
      } else {
        await promotionsAPI.create(payload);
        toast.success('Tạo khuyến mãi thành công');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 text-lg mb-5">{initial?.id ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi'}</h3>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="form-label">Tên chương trình *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Giảm 20% cuối tuần" />
          </div>
          <div>
            <label className="form-label">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="form-input resize-none" placeholder="Mô tả chương trình" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Loại giảm giá</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input bg-white">
                <option value="percentage">Phần trăm</option>
                <option value="fixed">Giảm cố định</option>
                <option value="buy_x_get_y">Mua X tặng Y</option>
              </select>
            </div>
            <div>
              <label className="form-label">Giá trị *</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="form-input" placeholder="20" />
            </div>
            <div>
              <label className="form-label">Đơn tối thiểu</label>
              <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="form-input" placeholder="100000" />
            </div>
            <div>
              <label className="form-label">Giảm tối đa</label>
              <input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="form-input" placeholder="50000" />
            </div>
            <div>
              <label className="form-label">Giới hạn sử dụng</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="form-input" placeholder="100" />
            </div>
            <div>
              <label className="form-label">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input bg-white">
                <option value="active">Đang chạy</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="expired">Đã kết thúc</option>
                <option value="inactive">Tắt</option>
              </select>
            </div>
            <div>
              <label className="form-label">Ngày bắt đầu</label>
              <input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Ngày kết thúc</label>
              <input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });

  const load = async () => {
    setLoading(true);
    try {
      const r = await promotionsAPI.getAll({ status: statusFilter, search });
      setPromotions(r.data.data || []);
    } catch {
      toast.error('Không tải được khuyến mãi');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const filtered = useMemo(() => promotions, [promotions]);

  const columns = [
    {
      key: 'name', label: 'Khuyến mãi',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <Gift size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{v}</p>
            <p className="text-xs text-gray-500 capitalize">{row.type?.replace('_', ' ')}</p>
          </div>
        </div>
      ),
    },
    { key: 'value', label: 'Giảm giá', render: (v, row) => (row.type === 'percentage' ? `${v}%` : `${new Intl.NumberFormat('vi-VN').format(v)} ₫`) },
    { key: 'usage_count', label: 'Đã dùng', render: (v, row) => <span>{v || 0}/{row.usage_limit || '∞'}</span> },
    { key: 'starts_at', label: 'Bắt đầu', render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '-') },
    { key: 'ends_at', label: 'Kết thúc', render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '∞') },
    { key: 'computed_status', label: 'Trạng thái', render: (v) => <PromoStatusBadge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <button type="button" onClick={() => setModal({ open: true, data: row })} className="px-3 py-1.5 text-xs border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg">Sửa</button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Khuyến mãi</h1>
          <p className="text-sm text-gray-500">Quản lý chương trình giảm giá và coupon</p>
        </div>
        <div className="flex gap-3">
          <Link to="/promotions/coupons" className="btn-secondary"><Tag size={16} /> Coupon</Link>
          <button type="button" onClick={() => setModal({ open: true, data: null })} className="btn-primary"><Plus size={16} /> Tạo khuyến mãi</button>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm khuyến mãi..." className="form-input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-auto min-w-40 bg-white">
          <option value="">Tất cả</option>
          <option value="active">Đang chạy</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="expired">Đã kết thúc</option>
          <option value="inactive">Tắt</option>
        </select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Không có khuyến mãi." />

      <PromotionModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSave={() => { setModal({ open: false, data: null }); load(); }} initial={modal.data} />
    </div>
  );
}
