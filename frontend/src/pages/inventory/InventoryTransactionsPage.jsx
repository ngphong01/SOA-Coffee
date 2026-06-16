import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftCircle, RefreshCw } from 'lucide-react';
import { inventoryAPI } from '../../api/inventory.api';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const typeConfig = {
  import: { label: 'Nhập kho', color: 'text-green-700 bg-green-50' },
  export: { label: 'Xuất kho', color: 'text-red-700 bg-red-50' },
  adjustment: { label: 'Điều chỉnh', color: 'text-blue-700 bg-blue-50' },
  sale: { label: 'Bán hàng', color: 'text-orange-700 bg-orange-50' },
  return: { label: 'Trả hàng', color: 'text-purple-700 bg-purple-50' },
};

export default function InventoryTransactionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ type: '', date_from: '', date_to: '' });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const r = await inventoryAPI.getTransactions({ page, limit: 20, ...filters });
      setData(r.data.data || []);
      setPagination(r.data.meta?.pagination || {});
    } catch {
      toast.error('Không tải được lịch sử giao dịch');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [filters]);

  const columns = [
    {
      key: 'type', label: 'Loại',
      render: (v) => {
        const c = typeConfig[v] || { label: v, color: 'text-gray-600 bg-gray-50' };
        return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${c.color}`}>{c.label}</span>;
      },
    },
    {
      key: 'product_name', label: 'Sản phẩm',
      render: (v, row) => (
        <div>
          <p className="font-medium text-sm text-gray-900">{v}</p>
          <p className="text-xs text-gray-400">{row.product_sku}</p>
        </div>
      ),
    },
    {
      key: 'quantity', label: 'Số lượng',
      render: (v, row) => (
        <span className={`font-bold ${row.type === 'import' || row.type === 'return' ? 'text-green-600' : 'text-red-600'}`}>
          {(row.type === 'import' || row.type === 'return') ? '+' : '-'}{v}
        </span>
      ),
    },
    { key: 'quantity_before', label: 'Trước', render: (v) => <span className="text-gray-500">{v}</span> },
    { key: 'quantity_after', label: 'Sau', render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'created_by_name', label: 'Người thao tác', render: (v) => v || '-' },
    { key: 'reference_no', label: 'Tham chiếu', render: (v) => <span className="font-mono text-xs">{v || '-'}</span> },
    { key: 'created_at', label: 'Ngày', render: (v) => <span className="text-xs text-gray-500">{v ? new Date(v).toLocaleString('vi-VN') : '-'}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/inventory" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeftCircle size={20} /></Link>
        <div>
          <h1 className="page-title">Lịch sử giao dịch kho</h1>
          <p className="page-subtitle">Theo dõi nhập, xuất và điều chỉnh tồn kho</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="form-input w-auto min-w-36 bg-white">
          <option value="">Tất cả loại</option>
          {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="form-input w-auto" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="form-input w-auto" />
        <button type="button" onClick={() => setFilters({ type: '', date_from: '', date_to: '' })} className="btn-secondary text-sm">Xóa lọc</button>
        <button type="button" onClick={() => load(1)} className="btn-secondary text-sm inline-flex items-center gap-2"><RefreshCw size={14} /> Làm mới</button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={(p) => load(p)} emptyMessage="Không có giao dịch nào." />
    </div>
  );
}
