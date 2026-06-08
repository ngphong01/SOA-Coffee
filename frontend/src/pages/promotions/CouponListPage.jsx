import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { promotionsAPI } from '../../api/promotions.api';
import DataTable from '../../components/common/DataTable';
import { Tag, Copy, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CouponListPage() {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const r = await promotionsAPI.getCoupons({ page, limit: 20 });
      setCoupons(r.data.data);
      setPagination(r.data.meta?.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Đã sao chép: ${code}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const columns = [
    {
      key: 'code', label: 'Code',
      render: (v) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">{v}</span>
          <button type="button" onClick={() => copyCode(v)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
            {copied === v ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          </button>
        </div>
      ),
    },
    { key: 'promotion_name', label: 'Khuyến mãi' },
    {
      key: 'discount_value', label: 'Giảm giá',
      render: (v, row) => <span className="font-semibold text-purple-700">{row.promotion_type === 'percentage' ? `${v}%` : `${v}đ`}</span>,
    },
    { key: 'usage_count', label: 'Đã dùng', render: (v, row) => <span>{v}/{row.usage_limit || '∞'}</span> },
    { key: 'expires_at', label: 'Hết hạn', render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : 'Không hết hạn') },
    { key: 'is_active', label: 'Trạng thái', render: (v) => <span className={v ? 'badge-success' : 'badge-neutral'}>{v ? 'Đang dùng' : 'Tắt'}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/promotions" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="page-title">Mã giảm giá</h1>
      </div>
      <DataTable columns={columns} data={coupons} loading={loading} pagination={pagination} onPageChange={(p) => load(p)} emptyMessage="Không tìm thấy mã giảm giá." />
    </div>
  );
}
