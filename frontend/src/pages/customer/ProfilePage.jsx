import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User, ShoppingBag, MapPin, CreditCard, Gift, Tag,
  Heart, LogOut, Home, Award, Headphones, Camera,
  Edit3, Save, X, Eye, EyeOff, Check, AlertCircle,
  ChevronRight, ArrowRight, Lock, Bell, Shield,
  Phone, Mail, Calendar, UserCheck, Loader2,
  CheckCircle, XCircle, Clock, Truck, Package,
  RotateCcw, Star, Copy, TrendingUp
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios.config";
import { toast } from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const vnd = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(n).replace("₫", "đ");

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} - ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_MENU = [
  { key: "overview",  label: "Tổng quan",               icon: Home,        path: null      },
  { key: "info",      label: "Thông tin tài khoản",     icon: User,        path: null      },
  { key: "security",  label: "Bảo mật",                 icon: Shield,      path: null      },
  { key: "orders",    label: "Đơn hàng của tôi",        icon: ShoppingBag, path: "/orders" },
  { key: "address",   label: "Địa chỉ của tôi",         icon: MapPin,      path: null      },
  { key: "payment",   label: "Thanh toán",              icon: CreditCard,  path: null      },
  { key: "points",    label: "Điểm thưởng",             icon: Gift,        path: null      },
  { key: "vouchers",  label: "Mã giảm giá",             icon: Tag,         path: null      },
  { key: "wishlist",  label: "Yêu thích",               icon: Heart,       path: "/wishlist"},
  { key: "notify",    label: "Thông báo",               icon: Bell,        path: null      },
];

const STATUS_META = {
  pending:    { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700",  icon: Clock       },
  confirmed:  { label: "Đã xác nhận",  color: "bg-blue-100 text-blue-700",     icon: CheckCircle },
  preparing:  { label: "Đang pha chế", color: "bg-orange-100 text-orange-700", icon: Package     },
  shipping:   { label: "Đang giao",    color: "bg-purple-100 text-purple-700", icon: Truck       },
  delivered:  { label: "Đã giao",      color: "bg-green-100 text-green-700",   icon: CheckCircle },
  cancelled:  { label: "Đã hủy",       color: "bg-red-100 text-red-700",       icon: XCircle     },
  processing: { label: "Đang xử lý",   color: "bg-blue-100 text-blue-700",     icon: RotateCcw   },
};

const MOCK_VOUCHERS = [
  { code: "GIAM15",   title: "Giảm 15%",         desc: "Đơn từ 49.000đ",   exp: "31/05/2024", color: "from-amber-500 to-orange-600"  },
  { code: "FREESHIP", title: "Miễn phí ship",     desc: "Mọi đơn hàng",    exp: "25/06/2024", color: "from-green-500 to-emerald-600" },
  { code: "GIAM10",   title: "Giảm 10%",         desc: "Đơn từ 29.000đ",   exp: "15/06/2024", color: "from-blue-500 to-indigo-600"   },
];

const MOCK_ORDERS = [
  { id:"23", order_code:"CS10023", status:"delivered",  total_amount:87000,  items:[{}], created_at:"2024-05-20T10:30:00Z", item_count:3 },
  { id:"22", order_code:"CS10022", status:"delivered",  total_amount:65000,  items:[{}], created_at:"2024-05-18T14:20:00Z", item_count:2 },
  { id:"21", order_code:"CS10021", status:"cancelled",  total_amount:120000, items:[{}], created_at:"2024-05-16T09:15:00Z", item_count:4 },
  { id:"20", order_code:"CS10020", status:"delivered",  total_amount:55000,  items:[{}], created_at:"2024-05-15T16:45:00Z", item_count:2 },
  { id:"19", order_code:"CS10019", status:"processing", total_amount:95000,  items:[{}], created_at:"2024-05-13T11:10:00Z", item_count:3 },
];

const MOCK_WISHLIST = [
  { id:1, name:"Cappuccino",        price:45000, image:"https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200" },
  { id:2, name:"Matcha Latte",      price:49000, image:"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200" },
  { id:3, name:"Caramel Macchiato", price:49000, image:"https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=200" },
  { id:4, name:"Tiramisu",          price:55000, image:"https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200" },
];

// ─── Password Strength ────────────────────────────────────────────────────────
const PWD_CHECKS = [
  { key:"len",     label:"Ít nhất 8 ký tự",          test: (p) => p.length >= 8              },
  { key:"upper",   label:"Có chữ hoa (A-Z)",          test: (p) => /[A-Z]/.test(p)            },
  { key:"digit",   label:"Có chữ số (0-9)",           test: (p) => /\d/.test(p)               },
  { key:"special", label:"Có ký tự đặc biệt (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p)    },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed  = PWD_CHECKS.filter((c) => c.test(password)).length;
  const pct     = (passed / PWD_CHECKS.length) * 100;
  const meta    = [
    { label:"Rất yếu", color:"bg-red-500"    },
    { label:"Yếu",     color:"bg-orange-500" },
    { label:"Trung bình", color:"bg-yellow-500"},
    { label:"Mạnh",    color:"bg-green-500"  },
  ][passed - 1] || { label:"", color:"bg-gray-200" };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Độ mạnh mật khẩu</span>
        {passed > 0 && <span className={`text-xs font-semibold ${meta.color.replace("bg-","text-")}`}>{meta.label}</span>}
      </div>
      <div className="flex gap-1">
        {PWD_CHECKS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passed ? meta.color : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        {PWD_CHECKS.map((c) => (
          <div key={c.key} className={`flex items-center gap-1.5 text-xs transition-colors ${c.test(password) ? "text-green-600" : "text-gray-400"}`}>
            {c.test(password)
              ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
              : <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />
            }
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Tổng quan ──────────────────────────────────────────────────────────
function TabOverview({ profile, orders, setActiveTab }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const wishlistRaw = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const wishlistCount = wishlistRaw.length;
  const totalSpent   = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const completedOrders = orders.filter((o) => o.status === "delivered").length;

  const STATS = [
    { icon: ShoppingBag, label:"Đơn hàng",           value: orders.length || 12,     color:"text-orange-500", bg:"bg-orange-50", tab:"orders"   },
    { icon: Gift,        label:"Điểm thưởng",         value: profile?.points || 820,  color:"text-amber-500",  bg:"bg-amber-50",  tab:"points"   },
    { icon: Tag,         label:"Mã giảm giá",         value: MOCK_VOUCHERS.length,    color:"text-blue-500",   bg:"bg-blue-50",   tab:"vouchers" },
    { icon: Heart,       label:"Sản phẩm yêu thích",  value: wishlistCount || 8,      color:"text-red-500",    bg:"bg-red-50",    tab:"wishlist" },
  ];

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => setActiveTab(s.tab)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <p className={`text-xs ${s.color} font-medium mt-2 flex items-center gap-1 group-hover:gap-2 transition-all`}>
                Xem chi tiết <ArrowRight className="w-3 h-3" />
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Đơn hàng gần đây</h2>
            <Link to="/orders" className="flex items-center gap-1 text-sm text-amber-700 font-medium hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(orders.length > 0 ? orders : MOCK_ORDERS).map((order) => {
              const meta   = STATUS_META[order.status] || STATUS_META.pending;
              const SIcon  = meta.icon;
              return (
                <Link
                  to={`/orders/${order.id || order._id}`}
                  key={order.id || order._id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      #{order.order_code || `CS${String(order.id || order._id).slice(-5)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDateTime(order.created_at || order.createdAt)} • {order.items?.length || order.item_count || 0} sản phẩm
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                    {vnd(order.total_amount || order.total || 0)}
                  </p>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${meta.color}`}>
                    <SIcon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Membership */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-950 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -right-3 bottom-4 w-16 h-16 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Coffee Shop</span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-lg font-bold mb-0.5">Thành viên Bạc</p>
              <p className="text-xs text-gray-400 mb-4">Cảm ơn bạn đã đồng hành!</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width:"82%" }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>820 / 1.000 điểm</span>
                <span>→ Vàng</span>
              </div>
            </div>
          </div>

          {/* Vouchers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Mã giảm giá</h3>
              <button onClick={() => setActiveTab("vouchers")} className="text-xs text-amber-700">Xem tất cả →</button>
            </div>
            <div className="p-3 space-y-2">
              {MOCK_VOUCHERS.map((v) => (
                <div key={v.code} className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl p-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${v.color} flex items-center justify-center flex-shrink-0`}>
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-900">{v.title}</p>
                    <p className="text-xs text-gray-400">{v.desc} • HSD: {v.exp}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(v.code)}
                    className="flex-shrink-0 text-xs bg-amber-800 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-900"
                  >
                    {copiedCode === v.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedCode === v.code ? "Đã chép" : v.code}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Sản phẩm yêu thích</h2>
          <Link to="/wishlist" className="flex items-center gap-1 text-sm text-amber-700 font-medium hover:gap-2 transition-all">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {MOCK_WISHLIST.map((item) => (
            <Link to={`/product/${item.id}`} key={item.id} className="group">
              <div className="relative rounded-xl overflow-hidden mb-2 aspect-square">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              <p className="text-sm font-bold text-amber-700">{vnd(item.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Thông tin tài khoản ────────────────────────────────────────────────
function TabInfo({ profile, setProfile }) {
  const { user } = useAuth();
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [form, setForm] = useState({
    name:     profile?.name     || profile?.fullName || user?.name || "",
    email:    profile?.email    || user?.email || "",
    phone:    profile?.phone    || "",
    birthday: profile?.birthday || profile?.date_of_birth || "",
    gender:   profile?.gender   || "",
    address:  profile?.address  || "",
  });
  const [errors, setErrors] = useState({});

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name:     profile.name     || profile.fullName || "",
        email:    profile.email    || "",
        phone:    profile.phone    || "",
        birthday: profile.birthday || profile.date_of_birth || "",
        gender:   profile.gender   || "",
        address:  profile.address  || "",
      });
    }
  }, [profile]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())            e.name  = "Họ tên không được để trống";
    if (!form.email.trim())           e.email = "Email không được để trống";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (form.phone && !/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g,"")))
      e.phone = "Số điện thoại không hợp lệ";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const r = await api.put("/users/customers/profile", {
        name:          form.name,
        phone:         form.phone,
        birthday:      form.birthday,
        date_of_birth: form.birthday,
        gender:        form.gender,
        address:       form.address,
      });
      setProfile((prev) => ({ ...prev, ...form, ...(r.data?.data || {}) }));
      setSaved(true);
      setEditing(false);
      setErrors({});
      toast.success("Cập nhật thông tin thành công!");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setForm({
      name:     profile?.name     || profile?.fullName || "",
      email:    profile?.email    || "",
      phone:    profile?.phone    || "",
      birthday: profile?.birthday || profile?.date_of_birth || "",
      gender:   profile?.gender   || "",
      address:  profile?.address  || "",
    });
  };

  const Field = ({ label, icon: Icon, name, type = "text", placeholder, readOnly = false, extra }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        {extra || (
          <input
            type={type}
            value={form[name]}
            onChange={(e) => { setForm((p) => ({ ...p, [name]: e.target.value })); setErrors((p) => ({ ...p, [name]: "" })); }}
            placeholder={placeholder}
            readOnly={!editing || readOnly}
            className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border text-sm transition-all
              ${!editing || readOnly ? "bg-gray-50 text-gray-700 border-gray-200 cursor-default" : "bg-white border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"}
              ${errors[name] ? "border-red-400 bg-red-50" : ""}`}
          />
        )}
      </div>
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thông tin tài khoản</h2>
          <p className="text-sm text-gray-500 mt-0.5">Cập nhật thông tin cá nhân của bạn</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <X className="w-4 h-4" /> Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-amber-800 text-white hover:bg-amber-900"
              }`}
            >
              {saved ? <><CheckCircle className="w-4 h-4" /> Đã lưu</> : <><Edit3 className="w-4 h-4" /> Chỉnh sửa</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar column */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full flex flex-col items-center">
            <div className="relative mb-4">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-amber-100 shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-3xl shadow-md border-4 border-amber-100">
                  {(form.name || "K").split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase()}
                </div>
              )}
              {editing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-amber-800 rounded-full flex items-center justify-center text-white shadow-md hover:bg-amber-900 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="font-bold text-gray-900 text-center">{form.name || "Khách hàng"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{form.email}</p>
            <div className="mt-3 flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">Thành viên Bạc</span>
            </div>
            {editing && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Nhấn vào icon máy ảnh để đổi ảnh đại diện
              </p>
            )}
          </div>

          {/* Quick info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 w-full space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thống kê nhanh</p>
            {[
              { icon: ShoppingBag, label:"Đơn hàng",       value:"12 đơn"       },
              { icon: TrendingUp,  label:"Đã chi tiêu",    value:"1.240.000đ"   },
              { icon: Star,        label:"Điểm thưởng",    value:"820 điểm"     },
              { icon: Calendar,    label:"Tham gia",        value:"01/01/2024"  },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icon className="w-3.5 h-3.5 text-amber-600" />
                    {item.label}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Họ và tên *" icon={User}     name="name"     placeholder="Nhập họ tên đầy đủ" />
            <Field label="Email *"     icon={Mail}     name="email"    type="email" placeholder="your@email.com" readOnly />
            <Field label="Số điện thoại" icon={Phone}  name="phone"    placeholder="0901 234 567" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                  readOnly={!editing}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all
                    ${!editing ? "bg-gray-50 text-gray-700 border-gray-200 cursor-default" : "bg-white border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"}`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giới tính</label>
              <div className="flex gap-3">
                {["male","female","other"].map((g) => (
                  <label
                    key={g}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm cursor-pointer transition-all ${
                      form.gender === g
                        ? "border-amber-400 bg-amber-50 text-amber-800 font-semibold"
                        : "border-gray-200 text-gray-600 hover:border-amber-200"
                    } ${!editing ? "pointer-events-none" : ""}`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                      className="sr-only"
                      disabled={!editing}
                    />
                    {g === "male" ? "Nam" : g === "female" ? "Nữ" : "Khác"}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  readOnly={!editing}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm resize-none transition-all
                    ${!editing ? "bg-gray-50 text-gray-700 border-gray-200 cursor-default" : "bg-white border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"}`}
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={handleCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Hủy thay đổi
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Save className="w-4 h-4" /> Lưu thay đổi</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Bảo mật ─────────────────────────────────────────────────────────────
function TabSecurity() {
  const [form, setForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current)            e.current = "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPwd)             e.newPwd  = "Vui lòng nhập mật khẩu mới";
    else if (form.newPwd.length < 8) e.newPwd = "Mật khẩu tối thiểu 8 ký tự";
    if (form.newPwd !== form.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    if (form.current === form.newPwd) e.newPwd = "Mật khẩu mới phải khác mật khẩu cũ";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: form.current,
        new_password:     form.newPwd,
        password_confirmation: form.confirm,
      });
      setSuccess(true);
      setForm({ current: "", newPwd: "", confirm: "" });
      setErrors({});
      toast.success("Đổi mật khẩu thành công!");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại";
      if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("hiện tại")) {
        setErrors({ current: "Mật khẩu hiện tại không đúng" });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const PwdInput = ({ label, name, placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show[name] ? "text" : "password"}
          value={form[name]}
          onChange={(e) => { setForm((p) => ({ ...p, [name]: e.target.value })); setErrors((p) => ({ ...p, [name]: "" })); }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none transition-all
            ${errors[name] ? "border-red-400 bg-red-50 focus:ring-red-100" : "border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"}`}
        />
        <button
          type="button"
          onClick={() => setShow((p) => ({ ...p, [name]: !p[name] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Bảo mật tài khoản</h2>
        <p className="text-sm text-gray-500 mt-0.5">Quản lý mật khẩu và bảo mật tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Đổi mật khẩu</p>
                <p className="text-xs text-gray-500">Sử dụng mật khẩu mạnh để bảo vệ tài khoản</p>
              </div>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-bold text-gray-900">Đổi mật khẩu thành công!</p>
                <p className="text-sm text-gray-500 text-center">Mật khẩu của bạn đã được cập nhật. Hãy sử dụng mật khẩu mới khi đăng nhập lần sau.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <PwdInput label="Mật khẩu hiện tại *"   name="current" placeholder="Nhập mật khẩu hiện tại" />
                <div className="border-t border-dashed border-gray-200 pt-5">
                  <PwdInput label="Mật khẩu mới *"        name="newPwd"  placeholder="Tối thiểu 8 ký tự" />
                  <PasswordStrength password={form.newPwd} />
                </div>
                <PwdInput label="Xác nhận mật khẩu mới *" name="confirm" placeholder="Nhập lại mật khẩu mới" />
                {form.newPwd && form.confirm && form.newPwd !== form.confirm && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mật khẩu xác nhận không khớp
                  </p>
                )}
                {form.newPwd && form.confirm && form.newPwd === form.confirm && form.confirm.length > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Mật khẩu khớp
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-amber-800 text-white font-semibold text-sm hover:bg-amber-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang đổi mật khẩu...</> : <><Shield className="w-4 h-4" /> Đổi mật khẩu</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security tips */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-700" /> Trạng thái bảo mật
            </h3>
            <div className="space-y-3">
              {[
                { label:"Mật khẩu",           status:true,  desc:"Đã thiết lập"        },
                { label:"Xác thực email",      status:true,  desc:"Đã xác thực"         },
                { label:"Số điện thoại",       status:false, desc:"Chưa liên kết"       },
                { label:"Xác thực 2 bước",     status:false, desc:"Chưa kích hoạt"      },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  {!item.status && (
                    <button className="text-xs text-amber-700 font-medium hover:underline">Thiết lập</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Lời khuyên bảo mật
            </h3>
            <ul className="space-y-2">
              {[
                "Sử dụng ít nhất 8 ký tự",
                "Kết hợp chữ hoa, chữ thường, số",
                "Thêm ký tự đặc biệt (!@#$%)",
                "Không dùng thông tin cá nhân",
                "Đổi mật khẩu định kỳ 3-6 tháng",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-amber-800">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Điểm thưởng ────────────────────────────────────────────────────────
function TabPoints() {
  const HISTORY = [
    { type:"earn",  label:"Mua Cappuccino",  points:+45,  date:"20/05/2024", order:"CS10023" },
    { type:"earn",  label:"Mua Latte",       points:+49,  date:"18/05/2024", order:"CS10022" },
    { type:"spend", label:"Đổi voucher 10%", points:-100, date:"16/05/2024", order:null       },
    { type:"earn",  label:"Mua Matcha Latte",points:+49,  date:"15/05/2024", order:"CS10020" },
    { type:"earn",  label:"Bonus sinh nhật", points:+200, date:"01/01/2024", order:null       },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Điểm thưởng</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tích điểm và đổi ưu đãi hấp dẫn</p>
      </div>

      {/* Points banner */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-200 text-sm mb-1">Tổng điểm hiện có</p>
              <p className="text-5xl font-bold">820</p>
              <p className="text-amber-200 text-sm mt-1">điểm thưởng</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 text-center">
              <Award className="w-8 h-8 text-white mx-auto mb-1" />
              <p className="text-xs text-amber-100 font-semibold">Thành viên Bạc</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm text-amber-200 mb-2">
              <span>Tiến độ lên hạng Vàng</span>
              <span>820 / 1.000 điểm</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-white" style={{ width:"82%" }} />
            </div>
            <p className="text-xs text-amber-200 mt-2">Còn 180 điểm nữa để lên hạng Vàng 🏆</p>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { name:"Đồng",    min:0,    max:499,  color:"from-orange-300 to-orange-400",    current:false },
          { name:"Bạc",     min:500,  max:999,  color:"from-gray-400 to-gray-500",        current:true  },
          { name:"Vàng",    min:1000, max:1999, color:"from-yellow-400 to-amber-500",     current:false },
          { name:"Bạch kim",min:2000, max:null, color:"from-purple-400 to-indigo-500",   current:false },
        ].map((tier) => (
          <div key={tier.name} className={`rounded-2xl p-4 border-2 transition-all ${tier.current ? "border-amber-400 shadow-md" : "border-gray-100"}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
              <Award className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-gray-900 text-sm">{tier.name}</p>
            <p className="text-xs text-gray-500">
              {tier.max ? `${tier.min.toLocaleString()} – ${tier.max.toLocaleString()} điểm` : `Từ ${tier.min.toLocaleString()} điểm`}
            </p>
            {tier.current && <span className="mt-2 inline-block bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">Hiện tại</span>}
          </div>
        ))}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Lịch sử điểm thưởng</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {HISTORY.map((h, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                h.type === "earn" ? "bg-green-100" : "bg-red-100"
              }`}>
                {h.type === "earn"
                  ? <TrendingUp className="w-5 h-5 text-green-600" />
                  : <Tag className="w-5 h-5 text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{h.label}</p>
                <p className="text-xs text-gray-400">{h.date}{h.order ? ` • #${h.order}` : ""}</p>
              </div>
              <span className={`font-bold text-base ${h.type === "earn" ? "text-green-600" : "text-red-500"}`}>
                {h.points > 0 ? "+" : ""}{h.points} điểm
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Mã giảm giá ────────────────────────────────────────────────────────
function TabVouchers() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const USED_VOUCHERS = [
    { code: "WELCOME10", title: "Chào mừng thành viên mới", desc: "Giảm 10%", exp: "01/01/2024", color: "from-gray-400 to-gray-500" },
  ];

  const displayList = activeTab === "available" ? MOCK_VOUCHERS : USED_VOUCHERS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mã giảm giá của tôi</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sử dụng các mã ưu đãi khi thanh toán</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key:"available", label:`Khả dụng (${MOCK_VOUCHERS.length})`        },
          { key:"used",      label:`Đã sử dụng (${USED_VOUCHERS.length})`      },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Voucher grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayList.map((v) => (
          <div key={v.code} className={`rounded-2xl overflow-hidden border shadow-sm ${activeTab === "used" ? "opacity-60" : "hover:shadow-md transition-shadow"}`}>
            {/* Top gradient */}
            <div className={`bg-gradient-to-r ${v.color} p-4 text-white relative overflow-hidden`}>
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full" />
              <Tag className="w-6 h-6 text-white/80 mb-2" />
              <p className="font-bold text-lg">{v.title}</p>
              <p className="text-white/80 text-sm">{v.desc}</p>
            </div>
            {/* Dashed divider */}
            <div className="relative bg-white">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-100" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-100" />
              <div className="border-t-2 border-dashed border-gray-200 mx-3" />
            </div>
            {/* Bottom */}
            <div className="bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Mã:</p>
                <p className="font-bold text-gray-900 tracking-wider">{v.code}</p>
                <p className="text-xs text-red-400 mt-0.5">HSD: {v.exp}</p>
              </div>
              {activeTab === "available" ? (
                <button
                  onClick={() => handleCopy(v.code)}
                  className="flex items-center gap-1.5 bg-amber-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-900 transition-colors"
                >
                  {copiedCode === v.code
                    ? <><Check className="w-4 h-4" /> Đã chép</>
                    : <><Copy className="w-4 h-4" /> Sao chép</>
                  }
                </button>
              ) : (
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Đã dùng</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab]   = useState("overview");
  const [profile, setProfile]       = useState(null);
  const [orders,  setOrders]        = useState([]);
  const [loading, setLoading]       = useState(true);

  // Support ?tab=xxx from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && SIDEBAR_MENU.some((m) => m.key === tab)) setActiveTab(tab);
  }, [location.search]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pRes, oRes] = await Promise.all([
          api.get("/auth/me").catch(() => ({ data: null })),
          api.get("/orders?limit=5").catch(() => ({ data: { data: [] } })),
        ]);
        setProfile(pRes.data?.data || pRes.data || user);
        const od = oRes.data?.data?.data || oRes.data?.data || oRes.data || [];
        setOrders(Array.isArray(od) ? od : []);
      } catch {
        setProfile(user);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleMenuClick = (item) => {
    if (item.path) { navigate(item.path); return; }
    setActiveTab(item.key);
  };

  const displayName = profile?.name || profile?.fullName || user?.name || "Khách hàng";
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();
  const wishlistCount = JSON.parse(localStorage.getItem("wishlist") || "[]").length;

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <TabOverview profile={profile} orders={orders} setActiveTab={setActiveTab} />;
      case "info":     return <TabInfo     profile={profile} setProfile={setProfile} />;
      case "security": return <TabSecurity />;
      case "points":   return <TabPoints />;
      case "vouchers": return <TabVouchers />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">Tính năng đang được phát triển</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">
          {/* ══ SIDEBAR ══ */}
          <aside className="w-64 flex-shrink-0 space-y-4 sticky top-24">
            {/* User card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="relative inline-block mb-3">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={displayName} className="w-16 h-16 rounded-full object-cover border-3 border-amber-200 mx-auto" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl mx-auto">
                    {initials}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs">Xin chào,</p>
              <p className="font-bold text-gray-900 text-sm mt-0.5 leading-tight">{displayName}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
                <Award className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">Thành viên Bạc</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {SIDEBAR_MENU.map((item, idx) => {
                const Icon    = item.icon;
                const isActive = activeTab === item.key && !item.path;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-amber-800 text-white font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    } ${idx !== SIDEBAR_MENU.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </div>
                    {item.key === "wishlist" && wishlistCount > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-gray-100"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>

            {/* Progress */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800">Thành viên Bạc</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">Tích thêm 180 điểm để lên hạng Vàng</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1.5">
                <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width:"82%" }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>820 / 1.000 điểm</span>
                <button onClick={() => setActiveTab("points")} className="text-amber-600 font-semibold">Chi tiết</button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-1">Cần hỗ trợ?</p>
              <p className="text-xs text-gray-500 mb-3">Chúng tôi luôn sẵn sàng giúp bạn</p>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-amber-800 text-amber-800 text-sm font-semibold hover:bg-amber-800 hover:text-white transition-colors"
              >
                <Headphones className="w-4 h-4" /> Liên hệ ngay
              </Link>
            </div>
          </aside>

          {/* ══ MAIN ══ */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
