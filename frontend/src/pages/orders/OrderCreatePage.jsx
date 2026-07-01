import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../api/products.api';
import { ordersAPI } from '../../api/orders.api';
import { paymentsAPI } from '../../api/payments.api';
import { Plus, Minus, ShoppingCart, CreditCard } from "../../utils/icons";
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [type, setType] = useState('dine_in');
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');

  useEffect(() => {
    productsAPI.getAll({ limit: 100, status: 'active' }).then((r) => setProducts(r.data.data || []));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === product.id);
      if (existing) {
        return prev.map((c) => (c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) => prev
      .map((c) => (c.product_id === productId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
      .filter((c) => c.quantity > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCreate = async (withPayment = false) => {
    if (!cart.length) return toast.error('Giỏ hàng trống');
    setLoading(true);
    try {
      const orderRes = await ordersAPI.create({
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
        type,
      });
      const order = orderRes.data.data;
      toast.success(`Đơn ${order.order_number} đã được tạo!`);

      if (withPayment) {
        await paymentsAPI.process({
          order_id: order.id,
          method: payMethod,
          amount_tendered: payMethod === 'cash' ? parseFloat(amountTendered || total) : total,
        });
        toast.success('Thanh toán thành công!');
      }
      navigate(`/orders/${order.id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Tạo đơn hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ShoppingCart size={24} /> POS — Tạo đơn mới</h1>
        <select value={type} onChange={(e) => setType(e.target.value)} className="form-input w-auto">
          <option value="dine_in">Tại quán</option>
          <option value="takeaway">Mang đi</option>
          <option value="delivery">Giao hàng</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold mb-4">Thực đơn</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
            {products.map((p) => (
              <button key={p.id} type="button" onClick={() => addToCart(p)}
                className="p-3 border border-gray-100 rounded-xl hover:border-amber-300 hover:bg-amber-50 text-left transition-colors">
                <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
                  {p.image_url || p.thumbnail_url ? (
                    <img src={p.image_url || p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">☕</span>
                  )}
                </div>
                <p className="font-medium text-sm text-gray-900 line-clamp-2">{p.name}</p>
                <p className="text-amber-800 font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold">Giỏ hàng ({cart.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cart.length === 0 && <p className="text-gray-400 text-sm">Chạm vào sản phẩm để thêm</p>}
            {cart.map((c) => (
              <div key={c.product_id} className="flex items-center justify-between text-sm">
                <span className="flex-1 truncate">{c.name}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateQty(c.product_id, -1)} className="p-1 rounded bg-gray-100"><Minus size={12} /></button>
                  <span className="w-6 text-center font-medium">{c.quantity}</span>
                  <button type="button" onClick={() => updateQty(c.product_id, 1)} className="p-1 rounded bg-gray-100"><Plus size={12} /></button>
                </div>
                <span className="w-20 text-right font-medium">{formatCurrency(c.price * c.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Thuế (8%)</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Tổng cộng</span><span className="text-amber-800">{formatCurrency(total)}</span></div>
          </div>
          <div className="space-y-2 border-t pt-3">
            <label className="form-label">Thanh toán (không bắt buộc)</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="form-input text-sm">
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="e_wallet">Ví điện tử</option>
            </select>
            {payMethod === 'cash' && (
              <input type="number" placeholder="Số tiền khách đưa" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} className="form-input text-sm" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" disabled={loading || !cart.length} onClick={() => handleCreate(false)} className="btn-secondary justify-center">Chỉ lưu đơn</button>
            <button type="button" disabled={loading || !cart.length} onClick={() => handleCreate(true)} className="btn-primary justify-center">
              <CreditCard size={16} /> Thanh toán & Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
