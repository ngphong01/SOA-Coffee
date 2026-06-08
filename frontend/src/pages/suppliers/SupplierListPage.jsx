import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { suppliersAPI } from '../../api/suppliers.api';
import DataTable from '../../components/common/DataTable';
import { Eye, Plus, Search, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const SupplierModal = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_code: '',
    payment_terms: '30',
    is_active: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        company_name: initial.company_name || '',
        contact_person: initial.contact_person || '',
        email: initial.email || '',
        phone: initial.phone || '',
        address: initial.address || '',
        tax_code: initial.tax_code || '',
        payment_terms: String(initial.payment_terms ?? '30'),
        is_active: Boolean(initial.is_active ?? true),
        notes: initial.notes || '',
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      toast.error('Vui lòng nhập tên nhà cung cấp');
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        await suppliersAPI.update(initial.id, form);
        toast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await suppliersAPI.create(form);
        toast.success('Tạo nhà cung cấp thành công');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được nhà cung cấp');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 text-lg mb-5">{initial?.id ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h3>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="form-label">Tên công ty *</label>
            <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="form-input" placeholder="Công ty TNHH ABC" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Người liên hệ</label>
              <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="form-input" placeholder="Nguyễn Văn B" />
            </div>
            <div>
              <label className="form-label">Mã số thuế</label>
              <input value={form.tax_code} onChange={(e) => setForm({ ...form, tax_code: e.target.value })} className="form-input" placeholder="0123456789" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" placeholder="supplier@example.com" />
            </div>
            <div>
              <label className="form-label">Số điện thoại</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" placeholder="0912345678" />
            </div>
          </div>
          <div>
            <label className="form-label">Địa chỉ</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" placeholder="123 Đường ABC, Quận 1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Điều khoản thanh toán</label>
              <select value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className="form-input bg-white">
                <option value="0">Thanh toán ngay</option>
                <option value="7">Net 7 ngày</option>
                <option value="15">Net 15 ngày</option>
                <option value="30">Net 30 ngày</option>
                <option value="45">Net 45 ngày</option>
              </select>
            </div>
            <div>
              <label className="form-label">Trạng thái</label>
              <select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} className="form-input bg-white">
                <option value="true">Đang hợp tác</option>
                <option value="false">Ngừng hợp tác</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Ghi chú</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="form-input resize-none" placeholder="Ghi chú thêm" />
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

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const r = await suppliersAPI.getAll({ page, limit: 15, search });
      setSuppliers(r.data.data || []);
      setPagination(r.data.meta?.pagination || { total: (r.data.data || []).length });
    } catch {
      toast.error('Không tải được nhà cung cấp');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => suppliers, [suppliers]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa nhà cung cấp "${name}"?`)) return;
    try {
      await suppliersAPI.delete(id);
      toast.success('Xóa nhà cung cấp thành công');
      load(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa');
    }
  };

  const columns = [
    {
      key: 'company_name', label: 'Nhà cung cấp',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Truck size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{v}</p>
            <p className="text-xs text-gray-500">{row.contact_person || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (v) => v || '-' },
    { key: 'phone', label: 'Điện thoại', render: (v) => v || '-' },
    { key: 'payment_terms', label: 'Thanh toán', render: (v) => `Net ${v || 0} ngày` },
    { key: 'total_purchased', label: 'Tổng mua', render: (v) => <span className="font-bold text-coffee-700">{formatCurrency(v)}</span> },
    { key: 'is_active', label: 'Trạng thái', render: (v) => <span className={v ? 'badge-success' : 'badge-neutral'}>{v ? 'Đang HT' : 'Ngừng HT'}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Link to={`/suppliers/${row.id}`} className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-800 rounded-lg inline-flex"><Eye size={15} /></Link>
          <button type="button" onClick={() => setModal({ open: true, data: row })} className="px-3 py-1.5 text-xs border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg">Sửa</button>
          <button type="button" onClick={() => handleDelete(row.id, row.company_name)} className="px-3 py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Nhà cung cấp</h1>
          <p className="text-sm text-gray-500">{pagination.total || suppliers.length} nhà cung cấp</p>
        </div>
        <div className="flex gap-3">
          <Link to="/suppliers/purchase-orders" className="btn-secondary">Đơn đặt hàng</Link>
          <button type="button" onClick={() => setModal({ open: true, data: null })} className="btn-primary"><Plus size={16} /> Thêm NCC</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm nhà cung cấp..." className="form-input pl-9" />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Không có nhà cung cấp." />

      <SupplierModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSave={() => { setModal({ open: false, data: null }); load(1); }} initial={modal.data} />
    </div>
  );
}
