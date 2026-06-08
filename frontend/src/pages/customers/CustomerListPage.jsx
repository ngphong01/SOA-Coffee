import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Star } from 'lucide-react';
import { customersAPI } from '../../api/customers.api';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const SegmentBadge = ({ segment }) => {
  const map = {
    vip: { label: 'VIP', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    regular: { label: 'Regular', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
    new: { label: 'New', cls: 'bg-gray-100 text-gray-700 border border-gray-200' },
  };
  const s = map[segment] || map.new;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

export default function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll({ page, limit: 15, search, segment });
      setCustomers(res.data.data);
      setPagination(res.data.meta?.pagination || {});
    } catch {
      toast.error('Không tải được khách hàng');
    } finally {
      setLoading(false);
    }
  }, [search, segment]);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(1), 300);
    return () => clearTimeout(t);
  }, [search, segment, fetchCustomers]);

  const columns = [
    {
      key: 'full_name', label: 'Khách hàng',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm">
            {name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-gray-500">{row.email || row.phone || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Điện thoại', render: (v) => v || '-' },
    { key: 'segment', label: 'Phân khúc', render: (v) => <SegmentBadge segment={v} /> },
    { key: 'total_orders', label: 'Đơn hàng' },
    { key: 'total_spent', label: 'Tổng chi', render: (v) => <span className="font-bold text-coffee-700">{formatCurrency(v)}</span> },
    {
      key: 'loyalty_points', label: 'Điểm',
      render: (v) => (
        <div className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /><span>{v}</span></div>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Link to={`/customers/${row.id}`} className="p-1.5 text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50 rounded-lg inline-flex transition-colors"><Eye size={15} /></Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Khách hàng</h1>
          <p className="page-subtitle">{pagination.total} khách hàng</p>
        </div>
        <button type="button" className="btn-primary"><Plus size={16} /> Thêm khách hàng</button>
      </div>
      <div className="card flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
          <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className="form-input w-auto min-w-36">
          <option value="">Tất cả phân khúc</option>
          <option value="new">Mới</option>
          <option value="regular">Thường xuyên</option>
          <option value="vip">VIP</option>
        </select>
      </div>
      <DataTable columns={columns} data={customers} loading={loading} pagination={pagination} onPageChange={fetchCustomers} emptyMessage="Không tìm thấy khách hàng." />
    </div>
  );
}
