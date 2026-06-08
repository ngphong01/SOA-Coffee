import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { inventoryAPI } from '../../api/inventory.api';
import { productsAPI } from '../../api/products.api';
import { suppliersAPI } from '../../api/suppliers.api';
import toast from 'react-hot-toast';

export default function InventoryImportPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', reference_no: '', notes: '' });
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_cost: 0 }]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          productsAPI.getAll({ limit: 200, status: 'active' }),
          suppliersAPI.getAll({ limit: 100 }),
        ]);
        setProducts(pRes.data.data || []);
        setSuppliers(sRes.data.data || []);
      } catch {
        toast.error('Không tải được dữ liệu hỗ trợ');
      }
    };
    load();
  }, []);

  const addRow = () => setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_cost: 0 }]);
  const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const validItems = useMemo(() => items.filter((i) => i.product_id && Number(i.quantity) > 0), [items]);
  const totalCost = useMemo(() => validItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_cost) || 0), 0), [validItems]);
  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

  const handleSubmit = async () => {
    if (!validItems.length) return toast.error('Vui lòng thêm ít nhất một sản phẩm');
    setLoading(true);
    try {
      await inventoryAPI.importStock({
        ...form,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        items: validItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost || 0),
        })),
      });
      toast.success('Nhập kho thành công');
      navigate('/inventory');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Import thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="page-title">Nhập kho</h1>
          <p className="page-subtitle">Tạo phiếu nhập với nhiều mặt hàng cùng lúc</p>
        </div>
      </div>

      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Nhà cung cấp</label>
          <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="form-input bg-white">
            <option value="">Chọn nhà cung cấp (không bắt buộc)</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.company_name || s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Số phiếu / tham chiếu</label>
          <input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} className="form-input" placeholder="INV-2026-001" />
        </div>
        <div>
          <label className="form-label">Ghi chú</label>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-input" placeholder="Nhập kho định kỳ" />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Danh sách sản phẩm</h3>
          <button type="button" onClick={addRow} className="btn-secondary text-sm"><Plus size={14} /> Thêm dòng</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Sản phẩm', 'Số lượng', 'Đơn giá', 'Tổng', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4">
                    <select value={item.product_id} onChange={(e) => updateRow(i, 'product_id', e.target.value)} className="form-input text-sm min-w-64 bg-white">
                      <option value="">Chọn sản phẩm</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => updateRow(i, 'quantity', e.target.value)} className="form-input text-sm w-28" />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" min="0" value={item.unit_cost} onChange={(e) => updateRow(i, 'unit_cost', e.target.value)} className="form-input text-sm w-36" />
                  </td>
                  <td className="py-2 pr-4 text-sm font-semibold whitespace-nowrap">{formatCurrency(Number(item.quantity || 0) * Number(item.unit_cost || 0))}</td>
                  <td className="py-2">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng giá trị nhập</p>
            <p className="text-2xl font-bold text-amber-800">{formatCurrency(totalCost)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary"><Save size={16} /> {loading ? 'Đang nhập...' : 'Xác nhận nhập kho'}</button>
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Hủy</button>
      </div>
    </div>
  );
}
