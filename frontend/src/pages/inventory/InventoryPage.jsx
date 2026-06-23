import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../api/inventory.api';
import { AlertTriangle, ArrowRight, Package, Plus, Search, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import DataTable from '../../components/common/DataTable';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const StockStatusBadge = ({ status }) => {
  const map = {
    in_stock: { label: 'Đủ hàng', cls: 'badge-success' },
    low_stock: { label: 'Sắp hết', cls: 'badge-warning' },
    out_of_stock: { label: 'Hết hàng', cls: 'badge-danger' },
  };
  const s = map[status] || { label: status, cls: 'badge-neutral' };
  return <span className={s.cls}>{s.label}</span>;
};

const AdjustModal = ({ item, onClose, onSave }) => {
  const [type, setType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Số lượng không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await inventoryAPI.adjust({ product_id: item.product_id, type, quantity: Number(quantity), note });
      toast.success('Đã điều chỉnh tồn kho');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không điều chỉnh được tồn kho');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Điều chỉnh tồn kho</h3>
        <p className="text-sm text-gray-500 mb-4">{item.product_name}</p>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'add', label: '+ Nhập' },
              { key: 'remove', label: '− Xuất' },
              { key: 'set', label: '= Đặt' },
            ].map((t) => (
              <button key={t.key} type="button" onClick={() => setType(t.key)} className={clsx('py-2 rounded-xl text-sm font-medium border transition-all', type === t.key ? 'bg-coffee-50 border-coffee-400 text-coffee-800' : 'border-coffee-200 text-coffee-500 hover:border-coffee-300')}>
                {t.label}
              </button>
            ))}
          </div>
          <div>
            <label className="form-label">Số lượng</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="form-input" placeholder="Nhập số lượng" min="1" />
          </div>
          <div>
            <label className="form-label">Ghi chú</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="form-input" placeholder="Lý do điều chỉnh" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Xác nhận'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ total: 0, low: 0, out: 0, value: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll();
      const data = res.data.data || [];
      setInventory(data);
      setStats({
        total: data.length,
        low: data.filter((i) => i.quantity > 0 && i.quantity <= i.min_stock_level).length,
        out: data.filter((i) => i.quantity <= 0).length,
        value: data.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.cost_price || 0)), 0),
      });
    } catch {
      toast.error('Không tải được tồn kho');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const getStockStatus = (item) => {
    if (item.quantity <= 0) return { label: 'Hết hàng', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', status: 'out_of_stock' };
    if (item.quantity <= item.min_stock_level) return { label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', status: 'low_stock' };
    return { label: 'Đủ hàng', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', status: 'in_stock' };
  };

  const filtered = useMemo(() => inventory.filter((item) => {
    const matchSearch = item.product_name?.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(item).status;
    const matchFilter = filter === 'all' || filter === status;
    return matchSearch && matchFilter;
  }), [inventory, search, filter]);

  const columns = [
    {
      key: 'product_name', label: 'Sản phẩm',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-lg">{row.product_icon || '☕'}</div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{row.product_name}</p>
            <p className="text-gray-400 text-xs">{row.category_name}</p>
          </div>
        </div>
      ),
    },
    { key: 'sku', label: 'SKU', render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'quantity', label: 'Tồn kho', render: (v, row) => <span className={clsx('font-bold', v <= 0 ? 'text-red-600' : v <= row.min_stock_level ? 'text-yellow-600' : 'text-gray-800')}>{v}</span> },
    { key: 'min_stock_level', label: 'Tối thiểu' },
    { key: 'stock_status', label: 'Trạng thái', render: (v) => <StockStatusBadge status={v} /> },
    {
      key: 'actions', label: 'Hành động',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setAdjustModal(row)} className="px-3 py-1.5 text-xs border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg">Điều chỉnh</button>
          <Link to="/admin/inventory/transactions" className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">Lịch sử</Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Quản lý kho</h1>
          <p className="page-subtitle">Theo dõi tồn kho và cảnh báo theo thời gian thực</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/inventory/import" className="btn-primary"><Plus size={16} /> Nhập kho</Link>
          <Link to="/admin/inventory/transactions" className="btn-secondary">Lịch sử</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng SKU', value: stats.total, icon: Package, gradient: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Sắp hết', value: stats.low, icon: AlertTriangle, gradient: 'from-amber-500 to-yellow-500', bgLight: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Hết hàng', value: stats.out, icon: TrendingDown, gradient: 'from-red-500 to-rose-500', bgLight: 'bg-red-50', iconColor: 'text-red-600' },
          { label: 'Giá trị kho', value: formatCurrency(stats.value), gradient: 'from-emerald-500 to-green-500', bgLight: 'bg-emerald-50', iconColor: 'text-emerald-600', isText: true },
        ].map((card, i) => (
          <div key={i} className="card-stat group">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 ${card.bgLight} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {card.icon ? <card.icon size={20} className={card.iconColor} /> : <span className={`${card.iconColor} text-xs font-bold`}>₫</span>}
              </div>
              <div>
                <p className="text-xs text-coffee-500 font-medium">{card.label}</p>
                <p className={clsx('font-bold text-coffee-900', card.isText ? 'text-sm' : 'text-xl')}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
          <input type="text" placeholder="Tìm theo tên hoặc SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input w-auto min-w-40">
          <option value="all">Tất cả</option>
          <option value="in_stock">Đủ hàng</option>
          <option value="low_stock">Sắp hết</option>
          <option value="out_of_stock">Hết hàng</option>
        </select>
        <Link to="/admin/inventory/alerts" className="btn-secondary whitespace-nowrap">Cảnh báo</Link>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Không có dữ liệu tồn kho." />

      {adjustModal && <AdjustModal item={adjustModal} onClose={() => setAdjustModal(null)} onSave={() => { setAdjustModal(null); fetchInventory(); }} />}
    </div>
  );
}
