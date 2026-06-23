import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder, updateOrderStatus } from '../../store/slices/orderSlice';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ─── Helpers ─── */
const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

/* ─── Inline SVG icons ─── */
const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconPrint = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16
             a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const IconCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0
             L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4.04
             a2 2 0 0 0 2 0l7-4.04A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconCreditCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ─── Status timeline config ─── */
const STATUS_ORDER = ['pending', 'processing', 'completed'];
const STATUS_LABELS = {
  pending: 'Đơn đã tạo',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const STATUS_COLORS = {
  pending:    { bg: 'bg-yellow-50',  border: 'border-yellow-300', text: 'text-yellow-700',  dot: 'bg-yellow-400'  },
  processing: { bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-700',    dot: 'bg-blue-500'    },
  completed:  { bg: 'bg-green-50',   border: 'border-green-300',  text: 'text-green-700',   dot: 'bg-green-500'   },
  cancelled:  { bg: 'bg-red-50',     border: 'border-red-300',    text: 'text-red-700',     dot: 'bg-red-400'     },
};

/* ─── Section Card wrapper ─── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
    {children}
  </div>
);

/* ─── Section heading ─── */
const SectionTitle = ({ icon, children }) => (
  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-base">
    <span className="text-amber-800">{icon}</span>
    {children}
  </h3>
);

/* ─── Row in summary / detail tables ─── */
const InfoRow = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between items-center py-1.5 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className={`font-medium text-gray-800 ${valueClass}`}>{value ?? '—'}</span>
  </div>
);

/* ══════════════════════════════════════════════════════ */
export default function OrderDetailPage() {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { currentOrder: order, loading } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrder(id)); }, [dispatch, id]);

  /* ── Status update handler ── */
  const handleStatusUpdate = async (status) => {
    let reason = null;
    if (status === 'cancelled') {
      reason = window.prompt('Vui lòng nhập lý do hủy:');
      if (reason === null) return; // user pressed Cancel
    }
    await dispatch(updateOrderStatus({ id: order.id, status, cancel_reason: reason }));
  };

  /* ── Loading / empty guard ── */
  if (loading || !order) return <LoadingSpinner />;

  /* ── Timeline steps ── */
  const isCancelled = order.status === 'cancelled';
  const currentIdx  = STATUS_ORDER.indexOf(order.status);
  const timeline = isCancelled
    ? [
        { label: 'Đơn đã tạo',  time: order.created_at,   done: true,  current: false },
        { label: 'Đã hủy',       time: order.updated_at,   done: true,  current: true,  cancelled: true },
      ]
    : STATUS_ORDER.map((s, i) => ({
        label:   STATUS_LABELS[s],
        time:    s === 'pending'    ? order.created_at
               : s === 'completed' ? order.completed_at
               : null,
        done:    i <= currentIdx,
        current: i === currentIdx,
      }));

  /* ── Price summary rows ── */
  const priceRows = [
    { label: 'Tạm tính',  value: vnd(order.subtotal) },
    order.discount_amount > 0 && {
      label: 'Giảm giá',
      value: `−${vnd(order.discount_amount)}`,
      valueClass: 'text-green-600',
    },
    order.voucher_code && { label: 'Mã giảm giá', value: order.voucher_code },
  ].filter(Boolean);

  return (
    <div className="max-w-5xl space-y-6 pb-10">

      {/* ══ Top bar ══ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            title="Quay lại"
          >
            <IconArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {order.order_number ?? `#${order.id}`}
              </h1>
              {/* Inline status pill (no external StatusBadge dependency needed, but keep it) */}
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{fmtDate(order.created_at)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200
                       text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <IconPrint /> In đơn
          </button>

          {/* pending → processing / cancel */}
          {order.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => handleStatusUpdate('processing')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800
                           text-white text-sm font-medium hover:bg-amber-900 transition-colors"
              >
                <IconCheck /> Xử lý đơn
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('cancelled')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500
                           text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <IconX /> Hủy đơn
              </button>
            </>
          )}

          {/* processing → completed */}
          {order.status === 'processing' && (
            <button
              type="button"
              onClick={() => handleStatusUpdate('completed')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600
                         text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <IconCheck /> Hoàn thành
            </button>
          )}
        </div>
      </div>

      {/* ══ Main grid ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order items */}
          <Card>
            <SectionTitle icon={<IconPackage />}>
              Món đã đặt
              <span className="ml-1 text-sm font-normal text-gray-400">
                ({order.items?.length ?? 0} món)
              </span>
            </SectionTitle>

            <div className="divide-y divide-gray-50">
              {(order.items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex-shrink-0
                                  flex items-center justify-center overflow-hidden">
                    {item.thumbnail_url
                      ? <img src={item.thumbnail_url} alt={item.product_name}
                             className="w-full h-full object-cover"
                             onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span className="text-xl">☕</span>}
                  </div>

                  {/* Name + SKU */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.product_sku}</p>
                    )}
                    {item.note && (
                      <p className="text-xs text-amber-700 mt-0.5 italic">Ghi chú: {item.note}</p>
                    )}
                  </div>

                  {/* Price × qty = total */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {vnd(item.unit_price)} × {item.quantity}
                    </p>
                    <p className="font-bold text-gray-900">{vnd(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price summary */}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-1">
              {priceRows.map((r, i) => (
                <InfoRow key={i} label={r.label} value={r.value} valueClass={r.valueClass} />
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-xl text-amber-800">{vnd(order.total_amount)}</span>
              </div>
            </div>
          </Card>

          {/* Payment info */}
          {order.payment && (
            <Card>
              <SectionTitle icon={<IconCreditCard />}>Thanh toán</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Phương thức', value: order.payment.method?.replace(/_/g, ' ') },
                  { label: 'Số tiền',     value: vnd(order.payment.amount) },
                  { label: 'Trạng thái',  value: order.payment.status ?? '—' },
                  order.payment.transaction_id && {
                    label: 'Mã giao dịch', value: order.payment.transaction_id,
                  },
                  order.payment.paid_at && {
                    label: 'Thanh toán lúc', value: fmtDate(order.payment.paid_at),
                  },
                ].filter(Boolean).map((item, i) => (
                  <div key={i}
                    className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="font-medium text-gray-800 capitalize text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Cancel reason */}
          {order.status === 'cancelled' && order.cancel_reason && (
            <Card>
              <SectionTitle icon={<IconX size={16} />}>Lý do hủy</SectionTitle>
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {order.cancel_reason}
              </p>
            </Card>
          )}
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-5">

          {/* Order info */}
          <Card>
            <SectionTitle icon={<IconInfo />}>Chi tiết đơn</SectionTitle>
            <div className="space-y-0.5">
              <InfoRow label="Loại đơn"
                value={order.type?.replace(/_/g, ' ')} />
              <InfoRow label="Thu ngân"
                value={order.cashier_name} />
              {order.table_number && (
                <InfoRow label="Bàn số" value={order.table_number} />
              )}
              {order.note && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Ghi chú đơn</p>
                  <p className="text-sm text-gray-700 italic">"{order.note}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Customer */}
          <Card>
            <SectionTitle icon={<IconUser />}>Khách hàng</SectionTitle>
            {order.customer_name ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center
                                justify-center font-bold text-amber-800 text-base flex-shrink-0">
                  {order.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  {order.customer_phone && (
                    <p className="text-xs text-gray-400">{order.customer_phone}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center
                                justify-center text-gray-400 text-lg flex-shrink-0">
                  ?
                </div>
                <p className="text-sm text-gray-400 italic">Khách vãng lai</p>
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            <SectionTitle icon={<IconClock />}>Dòng thời gian</SectionTitle>
            <ol className="relative border-l-2 border-gray-100 ml-3 space-y-5">
              {timeline.map((step, i) => {
                const dotColor = step.cancelled
                  ? 'bg-red-400 border-red-200'
                  : step.done
                    ? 'bg-green-500 border-green-200'
                    : 'bg-gray-200 border-gray-100';
                return (
                  <li key={i} className="ml-5">
                    {/* Dot */}
                    <span
                      className={`absolute -left-[11px] w-5 h-5 rounded-full border-2
                                  flex items-center justify-center ${dotColor}`}
                    >
                      {step.done && !step.cancelled && (
                        <span className="text-white" style={{ fontSize: 10 }}>
                          <IconCheck size={10} />
                        </span>
                      )}
                      {step.cancelled && (
                        <span className="text-white" style={{ fontSize: 10 }}>
                          <IconX size={10} />
                        </span>
                      )}
                    </span>

                    <p className={`text-sm font-medium leading-tight
                                  ${step.current  ? 'text-amber-800'
                                  : step.done     ? 'text-gray-900'
                                  : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(step.time)}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

        </div>
      </div>
    </div>
  );
}
