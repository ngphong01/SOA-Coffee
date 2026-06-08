import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../store/slices/orderSlice';
import { Plus, Eye, Calendar } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function OrderListPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector((s) => s.orders);
  const [page, setPage] = useState(1);
  const [localFilters, setLocalFilters] = useState({ status: '', date_from: '', date_to: '' });

  useEffect(() => {
    dispatch(fetchOrders({ page, limit: 10, ...localFilters }));
  }, [dispatch, page, localFilters]);

  const columns = [
    {
      key: 'order_number', label: 'Mã ĐH',
      render: (v, row) => (
        <Link to={`/orders/${row.id}`} className="font-semibold text-coffee-700 hover:underline">{v}</Link>
      ),
    },
    { key: 'customer_name', label: 'Khách hàng', render: (v) => <span className="text-gray-700">{v || 'Khách vãng lai'}</span> },
    { key: 'cashier_name', label: 'Thu ngân' },
    { key: 'type', label: 'Loại', render: (v) => <span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{v?.replace('_', ' ')}</span> },
    { key: 'item_count', label: 'Món', render: (v) => <span className="text-gray-600">{v} món</span> },
    { key: 'total_amount', label: 'Tổng tiền', render: (v) => <span className="font-bold text-gray-900">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Trạng thái', render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Ngày', render: (v) => <span className="text-gray-500 text-xs">{formatDate(v)}</span> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <Link to={`/orders/${row.id}`} className="p-1.5 text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50 rounded-lg inline-flex transition-colors">
          <Eye size={15} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Đơn hàng</h1>
          <p className="page-subtitle">{pagination.total} đơn hàng</p>
        </div>
        <Link to="/orders/create" className="btn-primary"><Plus size={16} /> Tạo đơn mới (POS)</Link>
      </div>
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select value={localFilters.status} onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })} className="form-input w-auto min-w-36">
            <option value="">Tất cả trạng thái</option>
            {['pending', 'processing', 'completed', 'cancelled', 'refunded'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input type="date" value={localFilters.date_from} onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value })} className="form-input w-auto" />
            <span className="text-gray-400 text-sm">đến</span>
            <input type="date" value={localFilters.date_to} onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })} className="form-input w-auto" />
          </div>
          <button type="button" onClick={() => { setLocalFilters({ status: '', date_from: '', date_to: '' }); setPage(1); }} className="btn-secondary text-sm">Xóa lọc</button>
        </div>
      </div>
      <DataTable columns={columns} data={items} loading={loading} pagination={pagination} onPageChange={setPage} emptyMessage="Không tìm thấy đơn hàng." />
    </div>
  );
}
