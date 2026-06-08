import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, ClipboardList, Edit2, Save } from 'lucide-react';
import { suppliersAPI } from '../../api/suppliers.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const SupplierPurchaseOrders = ({ orders = [] }) => {
  if (!orders.length) return <div className="text-sm text-gray-500">Chưa có đơn đặt hàng gần đây.</div>;
  return (
    <div className="space-y-3">
      {orders.map((po) => (
        <div key={po.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-3">
          <div>
            <p className="font-semibold text-gray-900">{po.po_number || `PO-${po.id}`}</p>
            <p className="text-xs text-gray-500 capitalize">{po.status || '-'}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-amber-800">{formatCurrency(po.total_amount)}</p>
            <p className="text-xs text-gray-500">{po.expected_date ? new Date(po.expected_date).toLocaleDateString('vi-VN') : '-'}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '', contact_person: '', email: '', phone: '', address: '', tax_code: '', payment_terms: '30', is_active: true, notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await suppliersAPI.getOne(id);
      const data = r.data.data || null;
      setSupplier(data);
      setForm({
        company_name: data?.company_name || '', contact_person: data?.contact_person || '', email: data?.email || '', phone: data?.phone || '', address: data?.address || '', tax_code: data?.tax_code || '', payment_terms: String(data?.payment_terms ?? '30'), is_active: Boolean(data?.is_active ?? true), notes: data?.notes || '',
      });
    } catch {
      toast.error('Không tải được thông tin nhà cung cấp');
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => ({
    totalPurchased: supplier?.total_purchased || 0,
    totalOrders: supplier?.purchase_orders_count || supplier?.recent_purchase_orders?.length || 0,
  }), [supplier]);

  if (loading) return <LoadingSpinner />;
  if (!supplier) return <div className="card py-12 text-center text-coffee-500">Không tìm thấy nhà cung cấp.</div>;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await suppliersAPI.update(id, { ...form, payment_terms: Number(form.payment_terms) });
      toast.success('Đã cập nhật nhà cung cấp');
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được nhà cung cấp');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link to="/suppliers" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <div className="flex-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Building2 className="text-blue-600" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{supplier.company_name || supplier.name}</h1>
              <p className="text-sm text-gray-500">{supplier.contact_person || 'Chưa có người liên hệ'}</p>
            </div>
          </div>
          <button type="button" onClick={() => setEditing((v) => !v)} className="btn-secondary"><Edit2 size={16} /> {editing ? 'Hủy sửa' : 'Chỉnh sửa'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><p className="text-xs text-coffee-500">Tổng mua</p><p className="text-2xl font-bold text-coffee-700">{formatCurrency(stats.totalPurchased)}</p></div>
        <div className="card"><p className="text-xs text-coffee-500">Đơn đặt hàng</p><p className="text-2xl font-bold text-coffee-900">{stats.totalOrders}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Thanh toán</p><p className="text-2xl font-bold text-gray-900">Net {supplier.payment_terms ?? 0} ngày</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2 space-y-4">
          <h2 className="font-bold text-gray-900">Thông tin liên hệ</h2>
          {editing ? (
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><label className="form-label">Tên công ty</label><input className="form-input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                <div><label className="form-label">Người liên hệ</label><input className="form-input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                <div><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="form-label">Điện thoại</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className="form-label">Địa chỉ</label><input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><label className="form-label">Mã số thuế</label><input className="form-input" value={form.tax_code} onChange={(e) => setForm({ ...form, tax_code: e.target.value })} /></div>
                <div><label className="form-label">Điều khoản thanh toán</label><input type="number" className="form-input" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></div>
                <div><label className="form-label">Trạng thái</label><select className="form-input bg-white" value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}><option value="true">Đang hợp tác</option><option value="false">Ngừng hợp tác</option></select></div>
                <div className="sm:col-span-2"><label className="form-label">Ghi chú</label><textarea className="form-input resize-none" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <button className="btn-primary" disabled={saving} type="submit"><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3"><Mail size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Email</p><p className="font-medium">{supplier.email || '-'}</p></div></div>
              <div className="flex items-start gap-3"><Phone size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Điện thoại</p><p className="font-medium">{supplier.phone || '-'}</p></div></div>
              <div className="flex items-start gap-3 sm:col-span-2"><MapPin size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Địa chỉ</p><p className="font-medium">{supplier.address || '-'}</p></div></div>
              <div><p className="text-gray-500">Mã số thuế</p><p className="font-medium">{supplier.tax_code || '-'}</p></div>
              <div><p className="text-gray-500">Trạng thái</p><p className={`font-medium ${supplier.is_active ? 'text-green-600' : 'text-gray-500'}`}>{supplier.is_active ? 'Đang hợp tác' : 'Ngừng hợp tác'}</p></div>
            </div>
          )}
          {!editing && <div><p className="text-gray-500 text-sm mb-1">Ghi chú</p><p className="text-sm text-gray-700 whitespace-pre-line">{supplier.notes || 'Không có ghi chú.'}</p></div>}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2"><ClipboardList size={18} className="text-amber-700" /><h2 className="font-bold text-gray-900">Đơn gần đây</h2></div>
          <SupplierPurchaseOrders orders={supplier.recent_purchase_orders || []} />
        </div>
      </div>
    </div>
  );
}
