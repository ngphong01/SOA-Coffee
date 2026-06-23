import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../store/slices/orderSlice';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

/* ─── Helpers ─── */
const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

/* ─── Inline SVG icons ─── */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);

const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6"  y1="6" x2="18" y2="18" />
  </svg>
);

/* ─── Status option labels (Vietnamese) ─── */
const STATUS_OPTIONS = [
  { value: '',           label: 'Tất cả trạng thái' },
  { value: 'pending',    label: 'Chờ xử lý'   },
  { value: 'processing', label: 'Đang xử lý'  },
  { value: 'completed',  label: 'Hoàn thành'  },
  { value: 'cancelled',  label: 'Đã hủy'      },
  { value: 'refunded',   label: 'Hoàn tiền'   },
];

/* ─── Default filter state ─── */
const DEFAULT_FILTERS = { status: '', date_from: '', date_to: '' };

/* ══════════════════════════════════════════════════════════ */
export default function OrderListPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector((s) => s.orders);

  const [page,         setPage]         = useState(1);
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);

  /* Count active filters for badge */
  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  useEffect(() => {
    dispatch(fetchOrders({ page, limit: 10, ...localFilters }));
  }, [dispatch, page, localFilters]);

  /* ── Helpers ── */
  const setFilter = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  /* ── Table columns ── */
  const columns = [
    {
      key: 'order_number',
      label: 'Mã ĐH',
      render: (v, row) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="font-semibold text-amber-800 hover:text-amber-900 hover:underline
                     underline-offset-2 transition-colors"
        >
          {v ?? `#${row.id}`}
        </Link>
      ),
    },
    {
      key: 'customer_name',
      label: 'Khách hàng',
      render: (v) =>
        v ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center
                            text-amber-800 font-bold text-xs flex-shrink-0">
              {v.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-800 text-sm">{v}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm italic">Khách vãng lai</span>
        ),
    },
    {
      key: 'cashier_name',
      label: 'Thu ngân',
      render: (v) => <span className="text-gray-600 text-sm">{v ?? '—'}</span>,
    },
    {
      key: 'type',
      label: 'Loại',
      render: (v) => (
        <span className="text-xs capitalize text-gray-600 bg-gray-100
                         px-2.5 py-1 rounded-lg font-medium">
          {v?.replace(/_/g, ' ') ?? '—'}
        </span>
      ),
    },
    {
      key: 'item_count',
      label: 'Món',
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
          <span className="font-semibold text-gray-900">{v}</span> món
        </span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Tổng tiền',
      render: (v) => (
        <span className="font-bold text-gray-900">{vnd(v)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'created_at',
      label: 'Ngày tạo',
      render: (v) => (
        <span className="text-gray-400 text-xs whitespace-nowrap">{fmtDate(v)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="p-1.5 text-gray-400 hover:text-amber-800 hover:bg-amber-50
                     rounded-lg inline-flex transition-colors"
          title="Xem chi tiết"
        >
          <IconEye />
        </Link>
      ),
    },
  ];

  /* ════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {pagination?.total ?? 0} đơn hàng
          </p>
        </div>

        <Link
          to="/admin/orders/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800
                     text-white text-sm font-semibold hover:bg-amber-900
                     transition-colors shadow-sm"
        >
          <IconPlus /> Tạo đơn mới (POS)
        </Link>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Filter icon + label */}
          <div className="flex items-center gap-1.5 text-gray-400 text-sm pr-1">
            <IconFilter />
            <span className="font-medium text-gray-600">Lọc</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-amber-800 text-white
                               text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>

          {/* Status select */}
          <select
            value={localFilters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                       text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300
                       focus:border-amber-400 transition min-w-[160px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              <IconCalendar />
            </span>
            <input
              type="date"
              value={localFilters.date_from}
              onChange={(e) => setFilter('date_from', e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                         text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300
                         focus:border-amber-400 transition"
            />
            <span className="text-gray-400 text-sm">đến</span>
            <input
              type="date"
              value={localFilters.date_to}
              onChange={(e) => setFilter('date_to', e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                         text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300
                         focus:border-amber-400 transition"
            />
          </div>

          {/* Clear filters — only show when something is active */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200
                         text-gray-500 text-sm hover:bg-gray-50 hover:text-gray-800
                         transition-colors"
            >
              <IconX /> Xóa lọc
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed border-gray-100">
            {localFilters.status && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                               bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                Trạng thái: {STATUS_OPTIONS.find((o) => o.value === localFilters.status)?.label}
                <button
                  type="button"
                  onClick={() => setFilter('status', '')}
                  className="hover:text-amber-900 ml-0.5"
                >
                  <IconX />
                </button>
              </span>
            )}
            {localFilters.date_from && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                               bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                Từ: {localFilters.date_from}
                <button
                  type="button"
                  onClick={() => setFilter('date_from', '')}
                  className="hover:text-blue-900 ml-0.5"
                >
                  <IconX />
                </button>
              </span>
            )}
            {localFilters.date_to && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                               bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                Đến: {localFilters.date_to}
                <button
                  type="button"
                  onClick={() => setFilter('date_to', '')}
                  className="hover:text-blue-900 ml-0.5"
                >
                  <IconX />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Data table ── */}
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="Không tìm thấy đơn hàng nào."
      />
    </div>
  );
}
