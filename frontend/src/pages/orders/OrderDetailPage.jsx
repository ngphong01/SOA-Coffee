import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder, updateOrderStatus } from '../../store/slices/orderSlice';
import { ArrowLeft, Printer, XCircle, CheckCircle, Package, User, Clock } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder: order, loading } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  const handleStatusUpdate = async (status) => {
    const reason = status === 'cancelled' ? window.prompt('Vui lòng nhập lý do hủy:') : null;
    if (status === 'cancelled' && reason === null) return;
    await dispatch(updateOrderStatus({ id: order.id, status, cancel_reason: reason }));
  };

  if (loading || !order) return <LoadingSpinner />;

  const timeline = [
    { status: 'pending', label: 'Đơn đã tạo', time: order.created_at, done: true },
    { status: 'processing', label: 'Đang xử lý', done: ['processing', 'completed'].includes(order.status) },
    { status: 'completed', label: 'Hoàn thành', time: order.completed_at, done: order.status === 'completed' },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> In</button>
          {order.status === 'pending' && (
            <>
              <button type="button" className="btn-primary" onClick={() => handleStatusUpdate('processing')}><CheckCircle size={16} /> Xử lý</button>
              <button type="button" className="btn-danger" onClick={() => handleStatusUpdate('cancelled')}><XCircle size={16} /> Hủy</button>
            </>
          )}
          {order.status === 'processing' && (
            <button type="button" className="btn-primary" onClick={() => handleStatusUpdate('completed')}><CheckCircle size={16} /> Hoàn thành</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package size={18} className="text-amber-800" /> Món ({order.items?.length || 0})</h3>
            <div className="space-y-3">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <span>☕</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.product_sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                    <p className="font-bold">{formatCurrency(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm"><span>Tạm tính</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600"><span>Giảm giá</span><span>-{formatCurrency(order.discount_amount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Tổng cộng</span><span className="text-amber-800">{formatCurrency(order.total_amount)}</span></div>
            </div>
          </div>
          {order.payment && (
            <div className="card">
              <h3 className="font-semibold mb-4">Thanh toán</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Phương thức</p><p className="font-medium capitalize">{order.payment.method?.replace('_', ' ')}</p></div>
                <div><p className="text-gray-500">Số tiền</p><p className="font-medium">{formatCurrency(order.payment.amount)}</p></div>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-5">
          <div className="card">
            <h3 className="font-semibold mb-4">Chi tiết</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Loại</span><span className="capitalize">{order.type?.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Thu ngân</span><span>{order.cashier_name}</span></div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><User size={16} /> Khách hàng</h3>
            {order.customer_name ? <p className="font-medium">{order.customer_name}</p> : <p className="text-gray-400 text-sm">Khách vãng lai</p>}
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock size={16} /> Dòng thời gian</h3>
            <div className="space-y-3">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {step.done && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    {step.time && <p className="text-xs text-gray-400">{formatDate(step.time)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
