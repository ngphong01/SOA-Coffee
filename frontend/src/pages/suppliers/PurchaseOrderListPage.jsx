import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { suppliersAPI } from '../../api/suppliers.api';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowLeft } from 'lucide-react';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function PurchaseOrderListPage() {
  const [pos, setPos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const r = await suppliersAPI.getAllPOs({ page, limit: 15 });
      setPos(r.data.data);
      setPagination(r.data.meta?.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const columns = [
    { key: 'po_number', label: 'PO #', render: (v) => <span className="font-mono font-semibold text-amber-800">{v}</span> },
    { key: 'supplier_name', label: 'Nhà cung cấp' },
    { key: 'item_count', label: 'Mặt hàng' },
    { key: 'total_amount', label: 'Tổng tiền', render: (v) => <span className="font-bold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Trạng thái', render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Ngày', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/suppliers" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="page-title">Đơn đặt hàng</h1>
      </div>
      <DataTable columns={columns} data={pos} loading={loading} pagination={pagination} onPageChange={(p) => load(p)} emptyMessage="Không có đơn đặt hàng." />
    </div>
  );
}
