import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User, ShoppingBag, MapPin, CreditCard, Gift, Tag,
  Heart, LogOut, Home, Award, Headphones, Camera,
  Edit3, Save, X, Eye, EyeOff, Check, AlertCircle,
  ChevronRight, ArrowRight, Lock, Bell, Shield,
  Phone, Mail, Calendar, Loader2,
  CheckCircle, XCircle, Clock, Truck, Package,
  RotateCcw, Star, Copy, TrendingUp, Plus, Trash2,
  MapPinOff, CreditCard as CardIcon, Wifi, WifiOff,
  RefreshCw, ChevronDown, Search, Filter
} from "../../utils/icons";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios.config";
import { toast } from "react-hot-toast";

// ---------------------------------------------
// HELPERS
// ---------------------------------------------
const vnd = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(n || 0).replace("₫", "đ");

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
};

const getLocalWishlist = () => JSON.parse(localStorage.getItem("wishlist") || "[]");
const getLocalCart     = () => JSON.parse(localStorage.getItem("cart")     || "[]");

// ---------------------------------------------
// CONSTANTS
// ---------------------------------------------
const SIDEBAR_MENU = [
  { key: "overview",  label: "Tổng quan",             icon: Home        },
  { key: "info",      label: "Thông tin tài khoản",   icon: User        },
  { key: "security",  label: "Bảo mật",               icon: Shield      },
  { key: "orders",    label: "Đơn hàng của tôi",      icon: ShoppingBag },
  { key: "address",   label: "Địa chỉ của tôi",       icon: MapPin      },
  { key: "points",    label: "Điểm thưởng",           icon: Gift        },
  { key: "vouchers",  label: "Mã giảm giá",           icon: Tag         },
  { key: "wishlist",  label: "Sản phẩm yêu thích",    icon: Heart       },
  { key: "notify",    label: "Thông báo",             icon: Bell        },
];

const STATUS_META = {
  pending:    { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700",  icon: Clock       },
  confirmed:  { label: "Đã xác nhận",  color: "bg-blue-100 text-blue-700",      icon: CheckCircle },
  preparing:  { label: "Đang pha chế", color: "bg-orange-100 text-orange-700",  icon: Package     },
  shipping:   { label: "Đang giao",    color: "bg-purple-100 text-purple-700",  icon: Truck       },
  delivered:  { label: "Đã giao",      color: "bg-green-100 text-green-700",    icon: CheckCircle },
  cancelled:  { label: "Đã hủy",       color: "bg-red-100 text-red-700",        icon: XCircle     },
  processing: { label: "Đang xử lý",   color: "bg-blue-100 text-blue-700",      icon: RotateCcw   },
};

const MOCK_VOUCHERS = [
  { code: "GIAM15",   title: "Giảm 15%",       desc: "Đơn từ 49.000đ",  exp: "31/12/2025", color: "from-amber-500 to-orange-600"  },
  { code: "FREESHIP", title: "Miễn phí ship",   desc: "Mọi đơn hàng",   exp: "31/12/2025", color: "from-green-500 to-emerald-600" },
  { code: "GIAM10",   title: "Giảm 10%",        desc: "Đơn từ 29.000đ", exp: "31/12/2025", color: "from-blue-500 to-indigo-600"   },
];

const PWD_CHECKS = [
  { key:"len",     label:"Ít nhất 8 ký tự",           test: (p) => p.length >= 8             },
  { key:"upper",   label:"Có chữ hoa (A-Z)",           test: (p) => /[A-Z]/.test(p)           },
  { key:"digit",   label:"Có chữ số (0-9)",            test: (p) => /\d/.test(p)              },
  { key:"special", label:"Có ký tự đặc biệt (!@#$)",  test: (p) => /[^A-Za-z0-9]/.test(p)   },
];

// ---------------------------------------------
// SHARED UI COMPONENTS
// ---------------------------------------------
function SectionCard({ title, subtitle, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-amber-700" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 text-[14px]">{title}</h3>
            {subtitle && <p className="text-gray-400 text-[11.5px]">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <p className="font-bold text-gray-600 text-[14px] mb-1">{title}</p>
      <p className="text-gray-400 text-[13px] mb-5">{desc}</p>
      {action}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = PWD_CHECKS.filter((c) => c.test(password)).length;
  const meta = [
    { label:"Rất yếu",  color:"bg-red-500",    text:"text-red-500"    },
    { label:"Yếu",      color:"bg-orange-500", text:"text-orange-500" },
    { label:"Trung bình",color:"bg-yellow-500",text:"text-yellow-600" },
    { label:"Mạnh",     color:"bg-green-500",  text:"text-green-600"  },
  ][passed - 1] || { label:"", color:"bg-gray-200", text:"" };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Độ mạnh</span>
        {passed > 0 && <span className={`text-xs font-bold ${meta.text}`}>{meta.label}</span>}
      </div>
      <div className="flex gap-1">
        {PWD_CHECKS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passed ? meta.color : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {PWD_CHECKS.map((c) => (
          <div key={c.key} className={`flex items-center gap-1.5 text-[11px] ${c.test(password) ? "text-green-600" : "text-gray-400"}`}>
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

// ---------------------------------------------
// TAB: TỔNG QUAN
// ---------------------------------------------
function TabOverview({ profile, orders, setActiveTab }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const wishlistItems = getLocalWishlist();
  const totalSpent    = orders.reduce((s, o) => s + (o.total_amount || o.total || 0), 0);

  const STATS = [
    { icon: ShoppingBag, label:"Đơn hàng",          value: orders.length,         color:"text-orange-500", bg:"bg-orange-50",  tab:"orders"   },
    { icon: Gift,        label:"Điểm thưởng",        value: profile?.points || 820,color:"text-amber-500",  bg:"bg-amber-50",   tab:"points"   },
    { icon: Tag,         label:"Mã giảm giá",        value: MOCK_VOUCHERS.length,  color:"text-blue-500",   bg:"bg-blue-50",    tab:"vouchers" },
    { icon: Heart,       label:"Sản phẩm yêu thích", value: wishlistItems.length,  color:"text-red-500",    bg:"bg-red-50",     tab:"wishlist" },
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
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm
                         hover:shadow-md transition-all text-left group"
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
        {/* Đơn hàng gần đây */}
        <SectionCard
          title="Đơn hàng gần đây"
          icon={ShoppingBag}
          action={
            <button onClick={() => setActiveTab("orders")}
              className="flex items-center gap-1 text-sm text-amber-700 font-medium hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          }
        >
          <div className="divide-y divide-gray-50">
            {orders.slice(0,4).map((order) => {
              const meta  = STATUS_META[order.status] || STATUS_META.pending;
              const SIcon = meta.icon;
              const oid   = order.id || order._id;
              return (
                <button
                  key={oid}
                  onClick={() => setActiveTab("orders")}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100
                                  flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-[13px]">
                      #{order.order_code || `CS${String(oid).slice(-5)}`}
                    </p>
                    <p className="text-[11.5px] text-gray-400">
                      {fmtDate(order.created_at || order.createdAt)} • {order.items?.length || order.item_count || 0} sp
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[13px] text-gray-900">{vnd(order.total_amount || order.total)}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color}`}>
                      <SIcon className="w-2.5 h-2.5" />
                      {meta.label}
                    </span>
                  </div>
                </button>
              );
            })}
            {orders.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                Chưa có đơn hàng nào
              </div>
            )}
          </div>
        </SectionCard>

        {/* Right col */}
        <div className="space-y-5 lg:col-span-1">
          {/* Membership card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-950 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -right-3 bottom-4  w-16 h-16 bg-white/5  rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coffee Shop</span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-lg font-bold mb-0.5">Thành viên Bạc</p>
              <p className="text-[11.5px] text-gray-400 mb-4">Cảm ơn bạn đã ủng hộ!</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width:"82%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>820 / 1.000 điểm</span>
                <button onClick={() => setActiveTab("points")} className="text-amber-400 font-semibold">Đi Vàng</button>
              </div>
            </div>
          </div>

          {/* Vouchers */}
          <SectionCard
            title="Mã giảm giá"
            action={
              <button onClick={() => setActiveTab("vouchers")}
                className="text-xs text-amber-700 font-medium hover:underline">
                Xem tất cả →
              </button>
            }
          >
            <div className="p-3 space-y-2">
              {MOCK_VOUCHERS.slice(0,2).map((v) => (
                <div key={v.code} className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl p-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${v.color} flex items-center justify-center flex-shrink-0`}>
                    <Tag className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[12px] text-gray-900">{v.title}</p>
                    <p className="text-[11px] text-gray-400">{v.desc}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(v.code)}
                    className="flex-shrink-0 text-[11px] bg-amber-800 text-white
                               px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-amber-900"
                  >
                    {copiedCode === v.code
                      ? <><Check className="w-3 h-3" /> Copied</>
                      : <><Copy className="w-3 h-3" /> {v.code}</>
                    }
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Wishlist preview */}
      {wishlistItems.length > 0 && (
        <SectionCard
          title="Sản phẩm yêu thích"
          icon={Heart}
          action={
            <button onClick={() => setActiveTab("wishlist")}
              className="flex items-center gap-1 text-sm text-amber-700 font-medium hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          }
        >
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {wishlistItems.slice(0,4).map((item) => (
              <Link to={`/product/${item.id}`} key={item.id} className="group">
                <div className="relative rounded-xl overflow-hidden mb-2 aspect-square bg-amber-50">
                  <img
                    src={item.thumbnail_url || item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = "/logo.svg"; }}
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-[13px] font-bold text-amber-700">{vnd(item.price)}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ---------------------------------------------
// TAB: THÔNG TIN TÀI KHOẢN
// ---------------------------------------------
function TabInfo({ profile, setProfile }) {
  const { user } = useAuth();
  const fileRef   = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [form, setForm] = useState({
    name:     "", email: "", phone: "",
    birthday: "", gender: "", address: "",
  });
  const [errors, setErrors] = useState({});

  // Sync khi profile load
  useEffect(() => {
    if (profile || user) {
      const src = profile || user;
      setForm({
        name:     src.name     || src.fullName || src.full_name || "",
        email:    src.email    || "",
        phone:    src.phone    || src.phone_number || "",
        birthday: src.birthday || src.date_of_birth || "",
        gender:   src.gender   || "",
        address:  src.address  || "",
      });
      setAvatarPreview(src.avatar || src.avatar_url || null);
    }
  }, [profile, user]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Họ tên không được để trống";
    if (!form.email.trim()) e.email = "Email không được để trống";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (form.phone && !/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g,"")))
      e.phone = "Số điện thoại không hợp lệ";
    return e;
  };

// Upload avatar: đọc file → base64 → gửi JSON
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }

    setUploading(true);
    try {
      // Đọc file thành base64 data URI
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Preview ngay
      setAvatarPreview(base64);

      // Gửi base64 lên server
      const r = await api.post("/upload/avatar", { image: base64 });
      const newUrl = r.data?.data?.avatar_url || r.data?.avatar_url;
      if (newUrl) {
        setAvatarPreview(newUrl);
        setProfile((prev) => ({ ...prev, avatar: newUrl, avatar_url: newUrl }));
      }
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch {
      toast.error("Upload ảnh thất bại, ảnh hiển thị tạm thời");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const r = await api.patch("/users/profile", {
        full_name:     form.name,
        phone:         form.phone,
        date_of_birth: form.birthday,
        gender:        form.gender,
        address:       form.address,
      });
      const data = r.data?.data || {};
      setProfile((prev) => ({
        ...prev,
        ...form,
        date_of_birth: data.date_of_birth || form.birthday,
        gender: data.gender || form.gender,
        address: data.address || form.address,
        ...data,
      }));
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
    const src = profile || user;
    if (src) {
      setForm({
        name: src.name || src.fullName || src.full_name || "",
        email: src.email || "",
        phone: src.phone || src.phone_number || "",
        birthday: src.birthday || src.date_of_birth || "",
        gender: src.gender || "",
        address: src.address || "",
      });
      setAvatarPreview(src.avatar || src.avatar_url || null);
    }
  };

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const inputCls = (name, extra = "") =>
    `w-full pl-10 pr-4 py-2.5 rounded-xl border text-[13.5px] outline-none transition-all ${extra}
    ${errors[name] ? "border-red-400 bg-red-50" : ""}
    ${!editing
      ? "bg-gray-50 border-gray-200 cursor-default text-gray-700"
      : "bg-white border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thông tin tài khoản</h2>
          <p className="text-sm text-gray-500 mt-0.5">Cập nhật thông tin cá nhân của bạn</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200
                           text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <X className="w-4 h-4" /> Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-800
                           text-white text-sm font-semibold hover:bg-amber-900
                           disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                saved ? "bg-green-500 text-white" : "bg-amber-800 text-white hover:bg-amber-900"
              }`}>
              {saved ? <><CheckCircle className="w-4 h-4" /> Đã lưu</> : <><Edit3 className="w-4 h-4" /> Chỉnh sửa</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
            <div className="relative mb-4">
              {uploading ? (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-amber-100">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : avatarPreview ? (
                <img src={avatarPreview} alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-100 shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                                flex items-center justify-center text-white font-bold text-3xl
                                shadow-md border-4 border-amber-100">
                  {(form.name || "K").split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase()}
                </div>
              )}
              {editing && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-amber-800 rounded-full
                               flex items-center justify-center text-white shadow-md
                               hover:bg-amber-900 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*"
                    className="hidden" onChange={handleAvatarChange} />
                </>
              )}
            </div>
            <p className="font-bold text-gray-900 text-center text-[14.5px]">{form.name || "Khách hàng"}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">{form.email}</p>
            <div className="mt-3 flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[12px] font-semibold text-amber-800">Thành viên Bạc</span>
            </div>
            {editing && (
              <p className="text-[11px] text-gray-400 text-center mt-3">
                Nhấn icon để đổi ảnh đại diện (tối đa 5MB)
              </p>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Thống kê</p>
            {[
              { icon: ShoppingBag, label:"Đơn hàng",    value:"12 đơn"       },
              { icon: TrendingUp,  label:"Chi tiêu",    value:"1.240.000đ"   },
              { icon: Star,        label:"Điểm thưởng", value:"820 điểm"     },
              { icon: Calendar,    label:"Tham gia",    value: fmtDate(profile?.created_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-gray-500">
                  <Icon className="w-3.5 h-3.5 text-amber-600" />
                  {label}
                </div>
                <span className="text-[12px] font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Họ tên */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                Họ và tên <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  readOnly={!editing}
                  placeholder="Nguyễn Văn A"
                  className={inputCls("name")}
                />
              </div>
              {errors.name && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
            </div>

            {/* Email - readonly */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                Email <span className="text-[11px] text-gray-400">(không thể thay đổi)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.email}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-[13.5px]
                             bg-gray-50 border-gray-200 cursor-default text-gray-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  readOnly={!editing}
                  placeholder="0901 234 567"
                  className={inputCls("phone")}
                />
              </div>
              {errors.phone && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setField("birthday", e.target.value)}
                  readOnly={!editing}
                  className={inputCls("birthday")}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Giới tính</label>
              <div className="flex gap-2">
                {["male","female","other"].map((g) => (
                  <label key={g} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl
                    border text-[13px] cursor-pointer transition-all
                    ${form.gender === g ? "border-amber-400 bg-amber-50 text-amber-800 font-bold" : "border-gray-200 text-gray-600"}
                    ${!editing ? "pointer-events-none" : "hover:border-amber-300"}`}>
                    <input type="radio" name="gender" value={g}
                      checked={form.gender === g}
                      onChange={(e) => setField("gender", e.target.value)}
                      disabled={!editing}
                      className="sr-only"
                    />
                    {g === "male" ? "Nam" : g === "female" ? "Nữ" : "Khác"}
                  </label>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Địa chỉ</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  readOnly={!editing}
                  rows={3}
                  placeholder="Số nhà, đường, phường, quận, tỉnh"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-[13.5px] resize-none outline-none transition-all
                    ${!editing ? "bg-gray-50 border-gray-200 cursor-default text-gray-700" : "bg-white border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"}`}
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={handleCancel}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[13.5px] text-gray-600 hover:bg-gray-50">
                Hủy thay đổi
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-amber-800 text-white text-[13.5px] font-bold
                           hover:bg-amber-900 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Save className="w-4 h-4" />Lưu thay đổi</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------
// TAB: BẢO MẬT
// ---------------------------------------------
function TabSecurity() {
  const [form, setForm]       = useState({ current:"", newPwd:"", confirm:"" });
  const [show, setShow]       = useState({ current:false, newPwd:false, confirm:false });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current)                     e.current = "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPwd)                      e.newPwd  = "Vui lòng nhập mật khẩu mới";
    else if (form.newPwd.length < 8)       e.newPwd  = "Tối thiểu 8 ký tự";
    if (form.current === form.newPwd)      e.newPwd  = "Mật khẩu mới phải khác mật khẩu cũ";
    if (form.newPwd !== form.confirm)      e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password:      form.current,
        new_password:          form.newPwd,
        password_confirmation: form.confirm,
      });
      setSuccess(true);
      setForm({ current:"", newPwd:"", confirm:"" });
      setErrors({});
      toast.success("Đổi mật khẩu thành công!");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại";
      if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("hiện tại") || msg.toLowerCase().includes("wrong")) {
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
      <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show[name] ? "text" : "password"}
          value={form[name]}
          onChange={(e) => { setForm((p) => ({...p,[name]:e.target.value})); setErrors((p) => ({...p,[name]:""})); }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 py-2.5 rounded-xl border text-[13.5px] outline-none transition-all
            ${errors[name] ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
              : "border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"}`}
        />
        <button type="button"
          onClick={() => setShow((p) => ({...p,[name]:!p[name]}))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {errors[name] && (
        <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
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
        {/* Form đổi mật khẩu */}
        <div className="lg:col-span-2">
          <SectionCard title="Đổi mật khẩu" icon={Lock}
            subtitle="Sử dụng mật khẩu mạnh để bảo vệ tài khoản">
            <div className="p-6">
              {success ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-bold text-gray-900">Đổi mật khẩu thành công!</p>
                  <p className="text-sm text-gray-500 text-center max-w-xs">
                    Mật khẩu đã được cập nhật. Hãy sử dụng mật khẩu mới khi đăng nhập lần sau.
                  </p>
                  <button onClick={() => setSuccess(false)}
                    className="text-sm text-amber-700 font-medium hover:underline">
                    Đổi lại mật khẩu
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <PwdInput label="Mật khẩu hiện tại *" name="current" placeholder="Nhập mật khẩu hiện tại" />
                  <div className="border-t border-dashed border-gray-200 pt-5 space-y-4">
                    <PwdInput label="Mật khẩu mới *" name="newPwd" placeholder="Tối thiểu 8 ký tự" />
                    <PasswordStrength password={form.newPwd} />
                    <PwdInput label="Xác nhận mật khẩu *" name="confirm" placeholder="Nhập lại mật khẩu mới" />
                    {form.newPwd && form.confirm && (
                      <p className={`text-[12px] flex items-center gap-1 ${
                        form.newPwd === form.confirm ? "text-green-600" : "text-red-500"
                      }`}>
                        {form.newPwd === form.confirm
                          ? <><CheckCircle className="w-3 h-3" /> Mật khẩu khớp</>
                          : <><AlertCircle className="w-3 h-3" /> Mật khẩu không khớp</>
                        }
                      </p>
                    )}
                  </div>
                  <button type="submit" disabled={saving}
                    className="w-full py-3 rounded-xl bg-amber-800 text-white font-bold text-[13.5px]
                               hover:bg-amber-900 disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang đổi...</> : <><Shield className="w-4 h-4" />Đổi mật khẩu</>}
                  </button>
                </form>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Security status + tips */}
        <div className="space-y-4">
          <SectionCard title="Trạng thái bảo mật" icon={Shield}>
            <div className="p-4 space-y-3">
              {[
                { label:"Mật khẩu",       status:true,  desc:"Đã thiết lập"   },
                { label:"Xác thực email", status:true,  desc:"Đã xác thực"    },
                { label:"Số điện thoại",  status:false, desc:"Chưa liên kết"  },
                { label:"Xác thực 2 bước",status:false, desc:"Chưa kích hoạt" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <AlertCircle className="w-4 h-4 text-orange-400" />
                    }
                    <div>
                      <p className="text-[13px] font-medium text-gray-800">{item.label}</p>
                      <p className="text-[11px] text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  {!item.status && (
                    <button className="text-[11.5px] text-amber-700 font-semibold hover:underline">
                      Thiết lập
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h3 className="font-bold text-amber-900 text-[13px] mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Lời khuyên bảo mật
            </h3>
            <ul className="space-y-2">
              {["Ít nhất 8 ký tự","Kết hợp hoa + thường + số","Thêm ký tự đặc biệt","Không dùng thông tin cá nhân","Đổi mật khẩu 3-6 tháng/lần"].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-[12px] text-amber-800">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-600" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------
// TAB: ĐƠN HÀNG
// ---------------------------------------------
function TabOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const LIMIT = 8;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filter !== "all") params.append("status", filter);
      if (search.trim())    params.append("search", search.trim());
      const r = await api.get(`/orders?${params}`);
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      setOrders(Array.isArray(data) ? data : []);
      setTotal(r.data?.data?.total || r.data?.total || data.length);
    } catch {
      toast.error("Không tải được đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); fetchOrders(); }, [debouncedSearch, filter]); // eslint-disable-line

  const STATUS_FILTERS = [
    { key:"all",       label:"Tất cả"      },
    { key:"pending",   label:"Chờ xác nhận"},
    { key:"confirmed", label:"Đã xác nhận" },
    { key:"preparing", label:"Đang pha chế"},
    { key:"shipping",  label:"Đang giao"   },
    { key:"delivered", label:"Đã giao"     },
    { key:"cancelled", label:"Đã hủy"      },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Đơn hàng của tôi</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} đơn hàng</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-semibold border transition-all ${
              filter === f.key
                ? "bg-amber-800 text-white border-amber-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-amber-300"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                     bg-gray-50 focus:bg-white outline-none focus:border-amber-400
                     focus:ring-2 focus:ring-amber-100 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Không có đơn hàng"
          desc={filter !== "all" ? "Không có đơn hàng nào ở trạng thái này" : "Bạn chưa có đơn hàng nào"}
          action={
            <Link to="/menu"
              className="flex items-center gap-2 bg-amber-800 text-white font-bold px-6 py-2.5 rounded-xl text-[13.5px] hover:bg-amber-900 transition-colors">
              Đặt hàng ngay <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const oid    = order.id || order._id;
            const meta   = STATUS_META[order.status] || STATUS_META.pending;
            const SIcon  = meta.icon;
            const isOpen = expandedId === oid;

            return (
              <div key={oid} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Row chính */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : oid)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100
                                  flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-[13.5px]">
                        #{order.order_code || `CS${String(oid).slice(-5)}`}
                      </p>
                      <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.color}`}>
                        <SIcon className="w-2.5 h-2.5" />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-400">
                      {fmtDateTime(order.created_at || order.createdAt)} ?{" "}
                      {order.items?.length || order.item_count || 0} sản phẩm
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="font-bold text-[15px] text-gray-900">
                      {vnd(order.total_amount || order.total)}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Expandable detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                          Sản phẩm đã đặt
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3">
                              <div className="w-10 h-10 rounded-lg bg-amber-50 overflow-hidden flex-shrink-0">
                                <img
                                  src={item.thumbnail_url || item.product_image || "/logo.svg"}
                                  alt={item.product_name || item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = "/logo.svg"; }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-800 truncate">
                                  {item.product_name || item.name}
                                </p>
                                <p className="text-[11.5px] text-gray-400">
                                  x{item.quantity || item.qty || 1}
                                </p>
                              </div>
                              <p className="font-bold text-[13px] text-amber-700 flex-shrink-0">
                                {vnd((item.price || 0) * (item.quantity || item.qty || 1))}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      {order.delivery_address && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Địa chỉ</p>
                          <p className="text-gray-700">{order.delivery_address}</p>
                        </div>
                      )}
                      {order.payment_method && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Thanh toán</p>
                          <p className="text-gray-700 capitalize">{order.payment_method}</p>
                        </div>
                      )}
                      {order.note && (
                        <div className="col-span-2">
                          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Ghi chú</p>
                          <p className="text-gray-700">{order.note}</p>
                        </div>
                      )}
                    </div>

                    {/* Tổng tiền */}
                    <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-gray-700">Tổng thanh toán</p>
                      <p className="font-extrabold text-[16px] text-amber-700">
                        {vnd(order.total_amount || order.total)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {order.status === "delivered" && (
                        <Link to={`/product/${order.items?.[0]?.product_id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800
                                     text-white text-[12.5px] font-semibold hover:bg-amber-900 transition-colors">
                          <Star className="w-3.5 h-3.5" /> Đánh giá
                        </Link>
                      )}
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <button
                          onClick={async () => {
                            if (!window.confirm("Xác nhận hủy đơn hàng này?")) return;
                            try {
                              await api.patch(`/orders/${oid}/cancel`);
                              toast.success("Đã hủy đơn hàng");
                              fetchOrders();
                            } catch (err) {
                              toast.error(err?.response?.data?.message || "Hủy đơn thất bại");
                            }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200
                                     text-red-500 text-[12.5px] font-semibold hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Hủy đơn
                        </button>
                      )}
                      {order.status === "delivered" && (
                        <button
                          onClick={async () => {
                            if (!window.confirm("Đặt lại đơn hàng này?")) return;
                            try {
                              const cart = getLocalCart();
                              order.items?.forEach((item) => {
                                const idx = cart.findIndex((c) => c.id === (item.product_id || item.id));
                                if (idx >= 0) cart[idx].qty += (item.quantity || item.qty || 1);
                                else cart.push({
                                  id: item.product_id || item.id,
                                  name: item.product_name || item.name,
                                  price: item.price,
                                  thumbnail_url: item.thumbnail_url,
                                  qty: item.quantity || item.qty || 1,
                                });
                              });
                              localStorage.setItem("cart", JSON.stringify(cart));
                              window.dispatchEvent(new Event("cart-updated"));
                              toast.success("Đã thêm vào giỏ hàng!");
                            } catch {
                              toast.error("Không thể đặt lại đơn hàng");
                            }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200
                                     text-gray-600 text-[12.5px] font-semibold hover:bg-gray-50 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center
                       text-gray-500 hover:border-amber-300 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i+1)}
              className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${
                page === i+1 ? "bg-amber-800 text-white" : "border border-gray-200 text-gray-600 hover:border-amber-300"
              }`}>
              {i+1}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center
                       text-gray-500 hover:border-amber-300 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// TAB: ĐỊA CHỈ
// ---------------------------------------------
function TabAddress() {
  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const BLANK = { full_name:"", phone:"", address:"", city:"", district:"", ward:"", is_default:false };
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/users/customers/addresses");
      const data = r.data?.data || r.data || [];
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      // fallback localStorage
      const saved = JSON.parse(localStorage.getItem("user_addresses") || "[]");
      setAddresses(saved);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Vui lòng nhập họ tên";
    if (!form.phone.trim())     e.phone     = "Vui lòng nhập số điện thoại";
    else if (!/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g,""))) e.phone = "Số điện thoại không hợp lệ";
    if (!form.address.trim())   e.address   = "Vui lòng nhập địa chỉ";
    if (!form.city.trim())      e.city      = "Vui lòng nhập tỉnh/thành phố";
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/customers/addresses/${editingId}`, form);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await api.post("/users/customers/addresses", form);
        toast.success("Thêm địa chỉ thành công");
      }
      await fetchAddresses();
      resetForm();
    } catch {
      // fallback: luu localStorage
      const saved = JSON.parse(localStorage.getItem("user_addresses") || "[]");
      if (editingId) {
        const idx = saved.findIndex((a) => a.id === editingId);
        if (idx >= 0) saved[idx] = { ...saved[idx], ...form };
      } else {
        saved.push({ ...form, id: Date.now() });
      }
      localStorage.setItem("user_addresses", JSON.stringify(saved));
      setAddresses(saved);
      toast.success(editingId ? "Cập nhật địa chỉ thành công" : "Thêm địa chỉ thành công");
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    setDeleting(id);
    try {
      await api.delete(`/users/customers/addresses/${id}`);
      toast.success("Đã xóa địa chỉ");
      await fetchAddresses();
    } catch {
      const saved = JSON.parse(localStorage.getItem("user_addresses") || "[]")
        .filter((a) => a.id !== id);
      localStorage.setItem("user_addresses", JSON.stringify(saved));
      setAddresses(saved);
      toast.success("Đã xóa địa chỉ");
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/users/customers/addresses/${id}/default`);
      await fetchAddresses();
      toast.success("Đã đặt làm địa chỉ mặc định");
    } catch {
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
      toast.success("Đã đặt làm địa chỉ mặc định");
    }
  };

  const resetForm = () => {
    setForm(BLANK);
    setErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (addr) => {
    setForm({
      full_name:  addr.full_name  || "",
      phone:      addr.phone      || "",
      address:    addr.address    || "",
      city:       addr.city       || "",
      district:   addr.district   || "",
      ward:       addr.ward       || "",
      is_default: addr.is_default || false,
    });
    setEditingId(addr.id);
    setShowForm(true);
    setErrors({});
  };

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const inputCls = (name) =>
    `w-full px-4 py-2.5 rounded-xl border text-[13.5px] outline-none transition-all
    ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Địa chỉ của tôi</h2>
          <p className="text-sm text-gray-500 mt-0.5">{addresses.length} địa chỉ đã lưu</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-800 text-white font-bold text-[13.5px]
                       px-5 py-2.5 rounded-xl hover:bg-amber-900 transition-colors shadow-md shadow-amber-800/20">
            <Plus className="w-4 h-4" /> Thêm địa chỉ
          </button>
        )}
      </div>

      {/* Form th?m/s?a */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-md p-6">
          <h3 className="font-bold text-gray-900 text-[15px] mb-5">
            {editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                H? t?n <span className="text-red-400">*</span>
              </label>
              <input value={form.full_name} onChange={(e) => setField("full_name", e.target.value)}
                placeholder="Nguyễn Văn A" className={inputCls("full_name")} />
              {errors.full_name && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                Số điện thoại <span className="text-red-400">*</span>
              </label>
              <input value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                placeholder="0901 234 567" className={inputCls("phone")} />
              {errors.phone && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                Địa chỉ cụ thể <span className="text-red-400">*</span>
              </label>
              <input value={form.address} onChange={(e) => setField("address", e.target.value)}
                placeholder="Số nhà, tên đường" className={inputCls("address")} />
              {errors.address && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.address}</p>}
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Phu?ng/X?</label>
              <input value={form.ward} onChange={(e) => setField("ward", e.target.value)}
                placeholder="Phường Bến Nghé" className={inputCls("ward")} />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Qu?n/Huy?n</label>
              <input value={form.district} onChange={(e) => setField("district", e.target.value)}
                placeholder="Quận 1" className={inputCls("district")} />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                Tỉnh/Thành phố <span className="text-red-400">*</span>
              </label>
              <input value={form.city} onChange={(e) => setField("city", e.target.value)}
                placeholder="TP. Hồ Chí Minh" className={inputCls("city")} />
              {errors.city && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.city}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_default" checked={form.is_default}
                onChange={(e) => setField("is_default", e.target.checked)}
                className="w-4 h-4 text-amber-800 rounded border-gray-300" />
              <label htmlFor="is_default" className="text-[13.5px] font-medium text-gray-700 cursor-pointer">
                Đặt làm địa chỉ mặc định
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={resetForm}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-[13.5px] text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-amber-800 text-white font-bold text-[13.5px]
                         hover:bg-amber-900 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Save className="w-4 h-4" />{editingId ? "Cập nhật" : "Thêm địa chỉ"}</>}
            </button>
          </div>
        </div>
      )}

      {/* Danh s?ch d?a ch? */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={MapPinOff}
          title="Chưa có địa chỉ nào"
          desc="Thêm địa chỉ để đặt hàng nhanh hơn"
          action={
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-amber-800 text-white font-bold px-6 py-2.5 rounded-xl text-[13.5px] hover:bg-amber-900">
              <Plus className="w-4 h-4" /> Thêm địa chỉ đầu tiên
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                addr.is_default ? "border-amber-300 shadow-amber-100" : "border-gray-100"
              }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  addr.is_default ? "bg-amber-100" : "bg-gray-100"
                }`}>
                  <MapPin className={`w-5 h-5 ${addr.is_default ? "text-amber-700" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900 text-[14px]">{addr.full_name}</p>
                    <span className="text-[12px] text-gray-400">• {addr.phone}</span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {[addr.address, addr.ward, addr.district, addr.city].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(addr)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                               hover:text-amber-700 hover:bg-amber-50 transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} disabled={deleting === addr.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                               hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40">
                    {deleting === addr.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)}
                      className="ml-1 text-[12px] text-amber-700 font-semibold hover:underline whitespace-nowrap">
                      Đặt làm mặc định
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// TAB: ĐIỂM THƯỞNG
// ---------------------------------------------
function TabPoints({ profile }) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const points = profile?.points || 820;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const r = await api.get("/users/customers/points/history");
        const data = r.data?.data?.data || r.data?.data || r.data || [];
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        // mock fallback
        setHistory([
          { type:"earn",  label:"Mua Cappuccino",  points:+45,  date: new Date().toISOString(), order_code:"CS10023" },
          { type:"earn",  label:"Mua Latte",       points:+49,  date: new Date(Date.now()-86400000).toISOString() },
          { type:"spend", label:"Đổi voucher 10%", points:-100, date: new Date(Date.now()-86400000*2).toISOString() },
          { type:"earn",  label:"Bonus sinh nhật", points:+200, date: new Date(Date.now()-86400000*10).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Điểm thưởng</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tích điểm để nhận ưu đãi trong các lần mua hàng</p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-200 text-[13px] mb-1">Tổng điểm hiện có</p>
              <p className="text-[52px] font-extrabold leading-none">{points}</p>
              <p className="text-amber-200 text-[13px] mt-1">điểm thưởng</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 text-center">
              <Award className="w-8 h-8 text-white mx-auto mb-1" />
              <p className="text-[12px] text-amber-100 font-semibold">Thành viên Bạc</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-[13px] text-amber-200 mb-2">
              <span>Tiến độ lần hàng Vàng</span>
              <span>{points} / 1.000 điểm</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-white transition-all duration-700"
                style={{ width:`${Math.min((points/1000)*100, 100)}%` }} />
            </div>
            <p className="text-[12px] text-amber-200 mt-2">
              Cần {Math.max(1000 - points, 0)} điểm nữa để lên hạng Vàng !
            </p>
          </div>
        </div>
      </div>

      {/* Membership tiers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { name:"Đồng",     min:0,    max:499,  color:"from-orange-300 to-orange-400",  current: points < 500  },
          { name:"Bạc",      min:500,  max:999,  color:"from-gray-400 to-gray-500",      current: points >= 500 && points < 1000  },
          { name:"Vàng",     min:1000, max:1999, color:"from-yellow-400 to-amber-500",   current: points >= 1000 && points < 2000 },
          { name:"Bạch kim", min:2000, max:null, color:"from-purple-400 to-indigo-500",  current: points >= 2000 },
        ].map((tier) => (
          <div key={tier.name} className={`rounded-2xl p-4 border-2 transition-all ${tier.current ? "border-amber-400 shadow-md" : "border-gray-100"}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
              <Award className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-gray-900 text-[13.5px]">{tier.name}</p>
            <p className="text-[11.5px] text-gray-500">
              {tier.max ? `${tier.min.toLocaleString()} - ${tier.max.toLocaleString()} điểm` : `Từ ${tier.min.toLocaleString()} điểm`}
            </p>
            {tier.current && (
              <span className="mt-2 inline-block bg-amber-100 text-amber-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
                Hiện tại
              </span>
            )}
          </div>
        ))}
      </div>

      {/* History */}
      <SectionCard title="Lịch sử điểm" icon={TrendingUp}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-[13.5px]">
            Chưa có lịch sử điểm thưởng
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((h, i) => (
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
                  <p className="text-[13.5px] font-semibold text-gray-900">{h.label || h.description}</p>
                  <p className="text-[12px] text-gray-400">
                    {fmtDateTime(h.date || h.created_at)}
                    {(h.order_code || h.order) && ` • #${h.order_code || h.order}`}
                  </p>
                </div>
                <span className={`font-extrabold text-[15px] ${h.type === "earn" ? "text-green-600" : "text-red-500"}`}>
                  {h.points > 0 ? "+" : ""}{h.points} điểm
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------
// TAB: MÃ GIẢM GIÁ
// ---------------------------------------------
function TabVouchers() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab,  setActiveTab]  = useState("available");
  const [vouchers,   setVouchers]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const r = await api.get("/vouchers/my");
        const data = r.data?.data?.data || r.data?.data || r.data || [];
        setVouchers(Array.isArray(data) ? data : MOCK_VOUCHERS);
      } catch {
        setVouchers(MOCK_VOUCHERS);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`?? sao ch?p m? ${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const available = vouchers.filter((v) => !v.used);
  const used      = vouchers.filter((v) => v.used);
  const list      = activeTab === "available" ? available : used;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mã giảm giá của tôi</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sử dụng khi thanh toán để tiết kiệm hơn</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key:"available", label:`Khả dụng (${available.length})`  },
          { key:"used",      label:`Đã dùng (${used.length})`        },
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              activeTab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-48" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Tag} title={activeTab === "available" ? "Không có mã giảm giá" : "Chưa sử dụng mã nào"}
          desc={activeTab === "available" ? "Hãy mua hàng để nhận mã ưu đãi" : "Các mã đã dùng sẽ hiển thị ở đây"} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((v) => (
            <div key={v.code} className={`rounded-2xl overflow-hidden border shadow-sm ${
              activeTab === "used" ? "opacity-60" : "hover:shadow-md transition-shadow"
            }`}>
              <div className={`bg-gradient-to-r ${v.color || "from-amber-500 to-orange-600"} p-4 text-white relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full" />
                <Tag className="w-5 h-5 text-white/70 mb-2" />
                <p className="font-extrabold text-[18px]">{v.title}</p>
                <p className="text-white/80 text-[13px]">{v.desc}</p>
              </div>
              <div className="relative bg-white">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-100" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-100" />
                <div className="border-t-2 border-dashed border-gray-200 mx-3" />
              </div>
              <div className="bg-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Mã:</p>
                  <p className="font-extrabold text-gray-900 tracking-wider text-[14px]">{v.code}</p>
                  <p className="text-[11px] text-red-400 mt-0.5">HSD: {v.exp || v.expires_at}</p>
                </div>
                {activeTab === "available" ? (
                  <button onClick={() => handleCopy(v.code)}
                    className="flex items-center gap-1.5 bg-amber-800 text-white px-4 py-2
                               rounded-xl text-[13px] font-bold hover:bg-amber-900 transition-colors">
                    {copiedCode === v.code
                      ? <><Check className="w-4 h-4" /> Đã sao chép</>
                      : <><Copy className="w-4 h-4" /> Sao chép</>
                    }
                  </button>
                ) : (
                  <span className="text-[12px] text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                    Đã dùng
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// TAB: YÊU THÍCH
// ---------------------------------------------
function TabWishlist() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    // Thử API trước, fallback localStorage
    try {
      const r = await api.get("/wishlist");
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
        setLoading(false);
        return;
      }
    } catch { /* fallback */ }

    // localStorage fallback
    const local = getLocalWishlist();
    if (local.length > 0) {
      // Fetch product details
      try {
        const details = await Promise.allSettled(
          local.map((i) => api.get(`/products/${i.id}`))
        );
        const products = details
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value.data?.data || r.value.data);
        setItems(products.filter(Boolean).length > 0 ? products.filter(Boolean) : local);
      } catch {
        setItems(local);
      }
    } else {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWishlist();
    window.addEventListener("wishlist-updated", loadWishlist);
    return () => window.removeEventListener("wishlist-updated", loadWishlist);
  }, [loadWishlist]);

  const handleRemove = (productId) => {
    const list = getLocalWishlist().filter((i) => i.id !== productId && i.id !== String(productId));
    localStorage.setItem("wishlist", JSON.stringify(list));
    window.dispatchEvent(new Event("wishlist-updated"));
    setItems((prev) => prev.filter((i) => i.id !== productId));
    toast("Đã xóa khỏi yêu thích", { duration: 1500 });
  };

  const handleAddToCart = (product) => {
    const cart = getLocalCart();
    const idx  = cart.findIndex((i) => i.id === product.id);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ id: product.id, name: product.name, price: product.price, thumbnail_url: product.thumbnail_url, qty: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success(`Đã thêm ${product.name} vào giỏ!`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm yêu thích</h2>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} sản phẩm</p>
        </div>
        {items.length > 0 && (
          <Link to="/menu" className="flex items-center gap-1.5 text-sm text-amber-700 font-semibold hover:gap-2 transition-all">
            Tiếp tục mua sắm <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Chưa có sản phẩm yêu thích"
          desc="Thêm sản phẩm vào danh sách yêu thích khi duyệt thực đơn"
          action={
            <Link to="/menu"
              className="flex items-center gap-2 bg-amber-800 text-white font-bold px-6 py-2.5 rounded-xl text-[13.5px] hover:bg-amber-900">
              Khám phá thực đơn <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm
                         hover:shadow-md transition-all group">
              <div className="relative aspect-square overflow-hidden bg-amber-50">
                <Link to={`/product/${item.id}`}>
                  <img
                    src={item.thumbnail_url || item.image || "/logo.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = "/logo.svg"; }}
                  />
                </Link>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md
                             flex items-center justify-center text-red-500
                             hover:bg-red-500 hover:text-white transition-all"
                  title="Bỏ yêu thích"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
              <div className="p-3">
                <Link to={`/product/${item.id}`}>
                  <p className="text-[13px] font-semibold text-gray-800 truncate hover:text-amber-700 mb-1">
                    {item.name}
                  </p>
                </Link>
                <p className="text-[13.5px] font-extrabold text-amber-700 mb-2">{vnd(item.price)}</p>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                             bg-amber-800 text-white text-[12px] font-bold
                             hover:bg-amber-900 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// TAB: THÔNG BÁO
// ---------------------------------------------
function TabNotify() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all"); // all | unread

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const r = await api.get("/notifications?limit=20");
        const data = r.data?.data?.data || r.data?.data || r.data || [];
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([
          { id:1, type:"order",   title:"Đơn hàng đã được xác nhận", message:"Đơn #CS10023 đã được xác nhận và đang pha chế", read:false, created_at: new Date().toISOString() },
          { id:2, type:"promo",   title:"Ưu đãi cuối tuần",           message:"Giảm 20% tất cả đồ uống từ thứ 7 và Chủ nhật",   read:false, created_at: new Date(Date.now()-3600000).toISOString() },
          { id:3, type:"points",  title:"Bạn vừa nhận được 45 điểm", message:"Điểm thưởng từ đơn hàng #CS10022",               read:true,  created_at: new Date(Date.now()-86400000).toISOString() },
          { id:4, type:"system",  title:"Cập nhật ứng dụng",          message:"Phiên bản mới 2.1.0 đã sẵn sàng",               read:true,  created_at: new Date(Date.now()-86400000*2).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
    } catch { /* ignore */ }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Đã đánh dấu tất cả là đã đọc");
  };

  const markRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); } catch { /* ignore */ }
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const TYPE_ICON = {
    order:  { icon: ShoppingBag, color: "bg-amber-100 text-amber-700" },
    promo:  { icon: Tag,         color: "bg-green-100 text-green-700" },
    points: { icon: Gift,        color: "bg-purple-100 text-purple-700" },
    system: { icon: Bell,        color: "bg-gray-100 text-gray-600" },
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="text-sm text-amber-700 font-semibold hover:underline">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key:"all",    label:`Tất cả (${notifications.length})` },
          { key:"unread", label:`Chưa đọc (${unreadCount})`        },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              filter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Không có thông báo" desc="Các thông báo mới sẽ xuất hiện ở đây" />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = TYPE_ICON[n.type] || TYPE_ICON.system;
            const Icon = meta.icon;
            return (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all
                            hover:shadow-sm ${n.read
                              ? "bg-white border-gray-100"
                              : "bg-amber-50/50 border-amber-200 shadow-sm"
                            }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13.5px] leading-snug ${n.read ? "font-semibold text-gray-800" : "font-extrabold text-gray-900"}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-[12.5px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[11.5px] text-gray-400 mt-1.5">{fmtDateTime(n.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// MAIN PROFILE PAGE
// ---------------------------------------------
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [activeTab, setActiveTab] = useState("overview");
  const [profile,   setProfile]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Sync URL ?tab=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && SIDEBAR_MENU.some((m) => m.key === tab)) setActiveTab(tab);
  }, [location.search]);

  // Fetch profile + recent orders
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, oRes] = await Promise.all([
          api.get("/auth/me").catch(() => ({ data: null })),
          api.get("/users/profile").catch(() => ({ data: null })),
          api.get("/orders?limit=5").catch(() => ({ data: { data: [] } })),
        ]);
        // Merge auth user + customer profile (date_of_birth, gender, address)
        const userData = pRes.data?.data || pRes.data || user || {};
        const custData = cRes.data?.data || cRes.data || {};
        setProfile({ ...userData, ...custData });
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleTabClick = useCallback((item) => {
    setActiveTab(item.key);
    // cập nhật URL nhẹ nhàng
    const url = new URL(window.location.href);
    url.searchParams.set("tab", item.key);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const displayName   = profile?.name || profile?.fullName || profile?.full_name || user?.name || "Khách hàng";
  const initials      = displayName.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();
  const avatarSrc     = profile?.avatar || profile?.avatar_url;
  const wishlistCount = getLocalWishlist().length;
  const unreadCount   = 2; // TODO: lấy từ API thực

  const renderContent = () => {
    switch (activeTab) {
      case "overview":  return <TabOverview  profile={profile} orders={orders} setActiveTab={setActiveTab} />;
      case "info":      return <TabInfo      profile={profile} setProfile={setProfile} />;
      case "security":  return <TabSecurity />;
      case "orders":    return <TabOrders />;
      case "address":   return <TabAddress />;
      case "points":    return <TabPoints profile={profile} />;
      case "vouchers":  return <TabVouchers />;
      case "wishlist":  return <TabWishlist />;
      case "notify":    return <TabNotify />;
      default: return (
        <EmptyState icon={User} title="Tính năng đang phát triển" desc="Chúng tôi sẽ sớm cập nhật!" />
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-[13.5px]">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">

          {/* -- SIDEBAR -- */}
          <aside className="w-64 flex-shrink-0 space-y-4 sticky top-24">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName}
                  className="w-16 h-16 rounded-full object-cover border-4 border-amber-100 mx-auto mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                                flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                  {initials}
                </div>
              )}
              <p className="text-[11.5px] text-gray-400">Xin chào,</p>
              <p className="font-bold text-gray-900 text-[14px] mt-0.5 leading-tight">{displayName}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1.5">
                <Award className="w-3 h-3 text-amber-600" />
                <span className="text-[11.5px] font-semibold text-amber-800">Thành viên Bạc</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {SIDEBAR_MENU.map((item, idx) => {
                const Icon     = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleTabClick(item)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-[13.5px]
                                transition-colors ${isActive
                                  ? "bg-amber-800 text-white font-bold"
                                  : "text-gray-600 hover:bg-gray-50 font-medium"
                                } ${idx !== SIDEBAR_MENU.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.key === "wishlist" && wishlistCount > 0 && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                        }`}>{wishlistCount}</span>
                      )}
                      {item.key === "notify" && unreadCount > 0 && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                        }`}>{unreadCount}</span>
                      )}
                    </div>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13.5px] font-medium
                           text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors
                           border-t border-gray-100"
              >
                <LogOut className="w-4 h-4" /> ?ang xu?t
              </button>
            </div>

            {/* Progress */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-[12px] font-bold text-amber-800">Thành viên Bạc</span>
              </div>
              <p className="text-[12px] text-gray-600 mb-3">Cần 180 điểm để lên hạng Vàng</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1.5">
                <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width:"82%" }} />
              </div>
              <div className="flex justify-between text-[11.5px] text-gray-500">
                <span>820 / 1.000 điểm</span>
                <button onClick={() => setActiveTab("points")} className="text-amber-700 font-bold">Chi ti?t</button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-[13.5px] font-bold text-gray-800 mb-1">Cần hỗ trợ</p>
              <p className="text-[12px] text-gray-500 mb-3">Chúng tôi luôn sẵn sàng giúp bạn</p>
              <Link to="/contact"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                           border-2 border-amber-800 text-amber-800 text-[13px] font-bold
                           hover:bg-amber-800 hover:text-white transition-colors">
                <Headphones className="w-4 h-4" /> Liên hệ ngay
              </Link>
            </div>
          </aside>

          {/* -- MAIN CONTENT -- */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
