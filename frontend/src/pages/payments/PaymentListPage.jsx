import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../api/payments.api';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { CreditCard, Banknote, Wallet, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const methodIcon = { cash: Banknote, card: CreditCard, e_wallet: Wallet, bank_transfer: BarChart3 };

export default function PaymentListPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ method: '', status: '', date_from: '', date_to: '' });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        paymentsAPI.getAll({ page, limit: 20, ...filters }),
        paymentsAPI.getStats(filters),
      ]);
      setPayments(pRes.data.data);
      setPagination(pRes.data.meta?.pagination || {});
      setStats(sRes.data.data?.summary);
    } catch {
      toast.error('Không tải được thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [filters]);

  const columns = [
    { key: 'transaction_id', label: 'Mã giao dịch', render: (v) => <span className="font-mono text-xs text-amber-800">{v || '-'}</span> },
    { key: 'order_number', label: 'Đơn hàng', render: (v) => <span className="font-semibold">{v}</span> },
    {
      key: 'method', label: 'Phương thức',
      render: (v) => {
        const Icon = methodIcon[v] || CreditCard;
        return <div className="flex items-center gap-2"><Icon size={14} className="text-gray-500" /><span className="capitalize text-sm">{v?.replace('_', ' ')}</span></div>;
      },
    },
    { key: 'amount', label: 'Số tiền', render: (v) => <span className="font-bold">{formatCurrency(v)}</span> },
    { key: 'change_amount', label: 'Tiền thừa', render: (v) => (v > 0 ? <span className="text-green-600">{formatCurrency(v)}</span> : '-') },
    { key: 'customer_name', label: 'Khách hàng', render: (v) => v || 'Khách vãng lai' },
    { key: 'status', label: 'Trạng thái', render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Ngày', render: (v) => <span className="text-xs text-gray-500">{new Date(v).toLocaleString('vi-VN')}</span> },
  ];

  return (
    <div className="space-y-5">
      <h1 className="page-title">Thanh toán</h1>
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tổng doanh thu', value: formatCurrency(stats.total_revenue), color: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
            { label: 'Giao dịch', value: stats.total_transactions, color: 'bg-gradient-to-br from-blue-500 to-indigo-500' },
            { label: 'TB giao dịch', value: formatCurrency(stats.avg_transaction), color: 'bg-gradient-to-br from-amber-500 to-orange-500' },
            { label: 'Hoàn tiền', value: formatCurrency(stats.total_refunds), color: 'bg-gradient-to-br from-violet-500 to-purple-500' },
          ].map((s, i) => (
            <div key={i} className="card-stat text-center">
              <div className={`h-1 w-12 mx-auto rounded-full mb-3 ${s.color}`} />
              <p className="text-xs text-coffee-500 font-medium">{s.label}</p>
              <p className="font-bold text-lg mt-1 text-coffee-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="card p-4 flex flex-wrap gap-3">
        <select value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })} className="form-input w-auto min-w-36">
          <option value="">Tất cả phương thức</option>
          <option value="cash">Tiền mặt</option>
          <option value="card">Thẻ</option>
          <option value="e_wallet">Ví điện tử</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="form-input w-auto min-w-36">
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Hoàn thành</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="form-input w-auto" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="form-input w-auto" />
        <button type="button" onClick={() => setFilters({ method: '', status: '', date_from: '', date_to: '' })} className="btn-secondary text-sm">Xóa lọc</button>
      </div>
      <DataTable columns={columns} data={payments} loading={loading} pagination={pagination} onPageChange={(p) => load(p)} emptyMessage="Không tìm thấy thanh toán." />
    </div>
  );
}
