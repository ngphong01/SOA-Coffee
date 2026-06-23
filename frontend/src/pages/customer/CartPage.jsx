import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api/axios.config";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const vnd = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(n)
    .replace("₫", "đ");

const getCart = () => {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
};

const setCartLS = (c) => {
  localStorage.setItem("cart", JSON.stringify(c));
  window.dispatchEvent(new Event("cart-updated"));
};

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_SHIP_THRESHOLD = 50000;

const MOCK_SUGGESTED = [
  { id: "s1", name: "Matcha Latte",       price: 49000, image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200" },
  { id: "s2", name: "Caramel Macchiato",  price: 49000, image: "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=200" },
  { id: "s3", name: "Bánh Croissant",     price: 29000, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200" },
];

const MOCK_VOUCHERS = {
  GIAM15:   { discount: (sub) => Math.round(sub * 0.15), label: "Giảm 15%" },
  FREESHIP: { discount: () => 15000,                     label: "Miễn phí ship" },
  GIAM10:   { discount: (sub) => Math.round(sub * 0.10), label: "Giảm 10%" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems]         = useState([]);
  const [voucherCode, setVoucherCode]     = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // ── Load cart ──
  const loadCart = useCallback(() => {
    setCartItems(getCart());
  }, []);

  useEffect(() => {
    loadCart();
    window.addEventListener("cart-updated", loadCart);
    return () => window.removeEventListener("cart-updated", loadCart);
  }, [loadCart]);

  // ── Fetch suggested products ──
  useEffect(() => {
    api.get("/products?sort=sold_count&limit=3")
      .then((r) => {
        const data = r.data?.data?.data || r.data?.data || r.data || [];
        setSuggestedProducts(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => setSuggestedProducts(MOCK_SUGGESTED));
  }, []);

  // ── Calculations ──
  const subtotal  = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount  = appliedVoucher?.discount || 0;
  const shipping  = subtotal > 0 && subtotal < FREE_SHIP_THRESHOLD ? 15000 : 0;
  const total     = Math.max(0, subtotal - discount + shipping);
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  // ── Handlers ──
  const updateQty = (id, size, delta) => {
    setCartItems((prev) => {
      const next = prev.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
      setCartLS(next);
      return next;
    });
  };

  const removeItem = (id, size) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => !(item.id === id && item.size === size));
      setCartLS(next);
      return next;
    });
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    setVoucherLoading(true);
    try {
      const r = await api.post("/vouchers/apply", {
        code: voucherCode.trim(),
        order_total: subtotal,
      });
      setAppliedVoucher(r.data?.data || {
        code: voucherCode.toUpperCase(),
        discount: Math.round(subtotal * 0.15),
        label: "Giảm giá",
      });
      toast.success("Áp dụng mã giảm giá thành công!");
    } catch {
      const mock = MOCK_VOUCHERS[voucherCode.toUpperCase()];
      if (mock) {
        setAppliedVoucher({
          code: voucherCode.toUpperCase(),
          discount: mock.discount(subtotal),
          label: mock.label,
        });
        toast.success("Áp dụng mã giảm giá thành công!");
      } else {
        toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    toast.success("Đã xóa mã giảm giá");
  };

  const addSuggestedToCart = (product) => {
    const cart = getCart();
    const existing = cart.find((i) => i.id === String(product.id || product._id) && i.size === "M");
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id:       String(product.id || product._id),
        name:     product.name,
        price:    product.price,
        image:    product.image,
        size:     "M",
        quantity: 1,
        note:     "",
      });
    }
    setCartLS(cart);
    loadCart();
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  // ── Empty State ──
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Giỏ hàng trống</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá thực đơn của chúng tôi nhé!
          </p>
          <Link
            to="/menu"
            className="inline-block bg-amber-800 text-white px-8 py-3 rounded-xl font-semibold hover:bg-amber-900 transition-colors"
          >
            Khám phá thực đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
            <p className="text-gray-500 text-sm mt-1">
              Bạn đang có{" "}
              <span className="font-semibold text-gray-700">{itemCount} sản phẩm</span>{" "}
              trong giỏ hàng
            </p>
          </div>
          <Link
            to="/menu"
            className="text-sm text-gray-600 hover:text-amber-800 border border-gray-200 bg-white px-4 py-2.5 rounded-xl hover:border-amber-300 transition-colors font-medium"
          >
            ← Tiếp tục mua hàng
          </Link>
        </div>

        {/* ── Free ship notice ── */}
        {subtotal < FREE_SHIP_THRESHOLD && subtotal > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-6 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              Mua thêm{" "}
              <span className="font-bold text-amber-900">
                {vnd(FREE_SHIP_THRESHOLD - subtotal)}
              </span>{" "}
              để được <span className="font-bold text-amber-900">miễn phí vận chuyển</span>!
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <div className="w-32 bg-amber-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-amber-600 transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100)}%` }}
                />
              </div>
              <span className="font-semibold whitespace-nowrap">
                {Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100)}%
              </span>
            </div>
          </div>
        )}

        {subtotal >= FREE_SHIP_THRESHOLD && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 mb-6">
            <p className="text-sm text-green-700 font-medium">
              Bạn đã được miễn phí vận chuyển!
            </p>
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ══ LEFT COLUMN ══ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── Cart Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100">
                <div className="col-span-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</div>
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Đơn giá</div>
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Số lượng</div>
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thành tiền</div>
              </div>

              {/* Cart items */}
              <div className="divide-y divide-gray-50">
                {cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Product info */}
                    <div className="col-span-6 flex items-center gap-4">
                      <Link to={`/product/${item.id}`} className="flex-shrink-0">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=100"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.id}`}
                          className="font-semibold text-gray-900 hover:text-amber-800 transition-colors text-sm block truncate"
                        >
                          {item.name}
                        </Link>
                        {item.size && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Size {item.size} &bull;{" "}
                            {item.size === "S" ? "350ml" : item.size === "M" ? "500ml" : "700ml"}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-xs text-gray-400 italic mt-0.5 truncate">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Unit price */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-600">{vnd(item.price)}</span>
                    </div>

                    {/* Quantity stepper */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, item.size, -1)}
                          disabled={item.quantity <= 1}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                        >
                          −
                        </button>
                        <span className="w-9 h-9 flex items-center justify-center text-sm font-bold text-gray-900 border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.size, 1)}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Line total + delete */}
                    <div className="col-span-2 flex items-center justify-end gap-3">
                      <span className="font-bold text-amber-700 text-sm">
                        {vnd(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="text-xs text-gray-300 hover:text-red-500 transition-colors font-bold text-lg leading-none"
                        title="Xóa sản phẩm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm?")) {
                      setCartLS([]);
                      loadCart();
                      toast.success("Đã xóa tất cả sản phẩm");
                    }
                  }}
                  className="text-sm text-red-400 hover:text-red-600 transition-colors font-medium"
                >
                  Xóa tất cả
                </button>
                <p className="text-sm text-gray-500">
                  Tạm tính:{" "}
                  <span className="font-bold text-gray-900 text-base">{vnd(subtotal)}</span>
                </p>
              </div>
            </div>

            {/* ── Voucher ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Mã giảm giá</h3>

              {appliedVoucher ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
                  <div>
                    <p className="font-bold text-green-800 text-sm">{appliedVoucher.code}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {appliedVoucher.label} &bull; Tiết kiệm {vnd(appliedVoucher.discount)}
                    </p>
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg"
                  >
                    Xóa mã
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyVoucher()}
                    placeholder="Nhập mã giảm giá (VD: GIAM15)"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={voucherLoading}
                    className="bg-amber-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-900 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {voucherLoading ? "Đang kiểm tra..." : "Áp dụng"}
                  </button>
                </div>
              )}

              {/* Hint vouchers */}
              {!appliedVoucher && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {Object.keys(MOCK_VOUCHERS).map((code) => (
                    <button
                      key={code}
                      onClick={() => setVoucherCode(code)}
                      className="text-xs border border-dashed border-amber-300 text-amber-700 px-2.5 py-1 rounded-lg hover:bg-amber-50 transition-colors font-medium"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Trust bar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="grid grid-cols-3 gap-6 divide-x divide-gray-100">
                {[
                  { title: "Giao hàng nhanh",     desc: "Miễn phí từ 50.000đ"       },
                  { title: "Đổi trả dễ dàng",     desc: "Trong vòng 24 giờ"         },
                  { title: "Thanh toán an toàn",   desc: "Bảo mật thông tin 100%"    },
                ].map((t) => (
                  <div key={t.title} className="pl-6 first:pl-0">
                    <p className="text-sm font-bold text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="w-80 flex-shrink-0 space-y-4">

            {/* ── Order Summary ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-5 text-base">Thông tin đơn hàng</h3>

              <div className="space-y-3.5 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính ({itemCount} sản phẩm)</span>
                  <span className="font-semibold text-gray-900">{vnd(subtotal)}</span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Mã giảm giá
                      <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        {appliedVoucher.code}
                      </span>
                    </span>
                    <span className="font-semibold text-green-600">
                      -{vnd(discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <div className="text-right">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-semibold">Miễn phí</span>
                    ) : (
                      <span className="font-semibold text-gray-900">{vnd(shipping)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mb-1">
                <span className="font-bold text-gray-900 text-base">Tổng thanh toán</span>
                <span className="font-bold text-2xl text-amber-700">{vnd(total)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-5">(Đã bao gồm thuế VAT nếu có)</p>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-amber-800 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-amber-900 transition-colors shadow-lg shadow-amber-800/25"
              >
                Tiến hành thanh toán →
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Bảo mật thanh toán 100% an toàn
              </p>

              {/* Payment methods */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center mb-2">Chấp nhận thanh toán</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {["VISA", "Mastercard", "MoMo", "ZaloPay", "VNPay", "COD"].map((m) => (
                    <span
                      key={m}
                      className="text-xs border border-gray-200 text-gray-500 px-2 py-1 rounded-lg font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Suggested Products ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm">Có thể bạn sẽ thích</h3>
              </div>

              <div className="divide-y divide-gray-50">
                {(suggestedProducts.length > 0 ? suggestedProducts : MOCK_SUGGESTED).map((product) => (
                  <div
                    key={product.id || product._id}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <Link to={`/product/${product.id || product._id}`} className="flex-shrink-0">
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=80"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-xl"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="text-sm font-semibold text-gray-800 hover:text-amber-800 transition-colors block truncate"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">
                        {vnd(product.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => addSuggestedToCart(product)}
                      className="flex-shrink-0 w-8 h-8 bg-amber-800 text-white rounded-xl flex items-center justify-center hover:bg-amber-900 transition-colors text-lg font-bold leading-none"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-50 text-center">
                <Link
                  to="/menu"
                  className="text-xs text-amber-700 font-semibold hover:underline"
                >
                  Xem thêm món khác →
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ── Features bar ── */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100">
            {[
              { title: "Nguyên liệu chất lượng",  desc: "Tuyển chọn kỹ lưỡng từng ngày"  },
              { title: "Pha chế chuyên nghiệp",   desc: "Đậm đà hương vị đặc trưng"       },
              { title: "Giao hàng nhanh chóng",   desc: "Đúng giờ, tận nơi bạn muốn"      },
              { title: "Hỗ trợ 24/7",             desc: "Luôn sẵn sàng phục vụ bạn"       },
            ].map((f) => (
              <div key={f.title} className="pl-6 first:pl-0">
                <p className="text-sm font-bold text-gray-800">{f.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
