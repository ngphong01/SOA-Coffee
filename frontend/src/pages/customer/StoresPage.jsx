import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Star, Navigation, ChevronDown, Search, Smartphone, Gift, Zap, Coffee, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const STORES = [
  { id: 1, name: 'Coffee Shop Nguyễn Huệ', address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', hours: '06:00 – 22:00', phone: '(028) 1234 5678', distance: '0.3 km', nearest: true, image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=80', lat: 10.7769, lng: 106.7009 },
  { id: 2, name: 'Coffee Shop Phan Xích Long', address: '45 Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh', hours: '06:00 – 22:00', phone: '(028) 2345 6789', distance: '2.1 km', nearest: false, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&q=80', lat: 10.7980, lng: 106.6836 },
  { id: 3, name: 'Coffee Shop Thảo Điền', address: '28 Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh', hours: '06:30 – 23:30', phone: '(028) 3456 7890', distance: '3.7 km', nearest: false, image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=300&q=80', lat: 10.8007, lng: 106.7338 },
];

const STATS = [
  { icon: Store, value: '12+', label: 'Cửa hàng' },
  { icon: MapPin, value: '5', label: 'Tỉnh thành' },
  { icon: Clock, value: '06:00–22:00', label: 'Giờ mở cửa' },
  { icon: Star, value: '4.9/5.0', label: 'Đánh giá chung' },
];

const CITY_OPTIONS = ['Tất cả tỉnh thành', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];
const SORT_OPTIONS = ['Gần tôi nhất', 'Đánh giá cao nhất', 'Mới nhất'];

const APP_FEATURES = [
  { icon: <Gift size={18} className="text-[#c8793a]"/>, title: 'Tích điểm đổi quà', sub: 'Nhận ưu đãi hấp dẫn' },
  { icon: <Zap size={18} className="text-[#c8793a]"/>, title: 'Đặt hàng nhanh chóng', sub: 'Không cần xếp hàng' },
  { icon: <Star size={18} className="text-[#c8793a]"/>, title: 'Ưu đãi độc quyền', sub: 'Dành riêng cho thành viên' },
];

function StoreRow({ store, onDirections }) {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-white hover:shadow-md transition mb-3 group">
      <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-amber-50 relative">
        <img src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = '/logo.svg'; }} />
        <div className="absolute inset-0 bg-[#2c1a0e]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Coffee size={22} className="text-white" /></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1"><h3 className="font-bold text-[#2c1a0e] text-[15px]">{store.name}</h3>{store.nearest && <span className="bg-[#c8793a] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">Gần bạn nhất</span>}</div>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1"><MapPin size={11} className="text-[#c8793a] flex-shrink-0" />{store.address}</div>
        <div className="flex items-center gap-4 text-xs text-gray-400"><span className="flex items-center gap-1"><Clock size={11} className="text-[#c8793a]" /> {store.hours}</span><span className="flex items-center gap-1"><Phone size={11} className="text-[#c8793a]" /> {store.phone}</span></div>
      </div>
      <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
        <span className="text-[#c8793a] font-extrabold text-sm">{store.distance}</span>
        <div className="flex gap-2">
          <button onClick={() => onDirections(store)} className="flex items-center gap-1.5 border border-[#c8793a] text-[#c8793a] text-xs font-semibold px-3 py-2 rounded-xl hover:bg-amber-50 transition"><Navigation size={12} /> Chỉ đường</button>
          <button className="flex items-center gap-1.5 bg-[#c8793a] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#b5692a] transition">Xem chi tiết</button>
        </div>
      </div>
    </div>
  );
}

export default function StoresPage() {
  const [city, setCity] = useState('Tất cả tỉnh thành');
  const [sortBy, setSortBy] = useState('Gần tôi nhất');
  const [showAll, setShowAll] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    if (!navigator.geolocation) { toast.error('Trình duyệt không hỗ trợ định vị'); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      () => { toast.success('Đã xác định vị trí! 📍'); setLocating(false); },
      () => { toast.error('Không thể lấy vị trí.'); setLocating(false); }
    );
  };

  const handleDirections = (store) => { window.open('https://maps.google.com/?q=' + store.lat + ',' + store.lng, '_blank'); };
  const displayed = showAll ? STORES : STORES.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-[#c8793a] text-sm font-semibold italic mb-3"><MapPin size={15} />Hệ thống cửa hàng</div>
              <h1 className="text-[38px] lg:text-[46px] font-extrabold text-[#2c1a0e] leading-tight mb-4">Tìm cửa hàng<br /><span className="text-[#c8793a]">gần bạn nhất</span></h1>
              <p className="text-gray-400 text-[14px] leading-relaxed mb-6 max-w-sm">Trải nghiệm không gian cà phê ấm cúng và thưởng thức những thức uống tuyệt hảo tại hệ thống cửa hàng của chúng tôi.</p>
              <button onClick={handleLocate} disabled={locating} className="flex items-center gap-2 bg-[#2c1a0e] hover:bg-[#c8793a] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 text-sm disabled:opacity-60"><MapPin size={16} />{locating ? 'Đang định vị...' : 'Cho phép định vị của tôi'}</button>
            </div>
            <div className="relative">
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80" alt="Coffee Shop" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d04]/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Coffee size={36} className="text-white/80 mx-auto mb-2" /><p className="text-white font-extrabold text-xl tracking-wide">Coffee Shop</p></div></div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 grid grid-cols-4 gap-3 mt-4">
                {STATS.map((s, i) => (<div key={i} className="text-center"><s.icon size={16} className="text-[#c8793a] mx-auto mb-1" /><p className="font-extrabold text-[#2c1a0e] text-sm leading-none">{s.value}</p><p className="text-gray-400 text-[10px] mt-0.5">{s.label}</p></div>))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#2c1a0e]">Danh sách cửa hàng</h2>
          <div className="flex gap-2">
            <div className="relative"><select value={city} onChange={(e) => setCity(e.target.value)} className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2 text-sm text-[#2c1a0e] outline-none focus:border-[#c8793a] transition cursor-pointer">{CITY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div>
            <div className="relative"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2 text-sm text-[#2c1a0e] outline-none focus:border-[#c8793a] transition cursor-pointer">{SORT_OPTIONS.map((s) => <option key={s}>Sắp xếp: {s}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            {displayed.map((s) => (<StoreRow key={s.id} store={s} onDirections={handleDirections} />))}
            {!showAll && STORES.length > 3 && (<button onClick={() => setShowAll(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-[#2c1a0e] text-sm font-semibold hover:border-[#c8793a] hover:text-[#c8793a] transition">Xem tất cả cửa hàng <ChevronDown size={15} /></button>)}
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100" style={{ minHeight: '400px' }}>
            <div className="absolute top-3 right-3 z-10"><button onClick={handleLocate} className="flex items-center gap-1.5 bg-white text-[#2c1a0e] text-xs font-bold px-3 py-2 rounded-xl shadow-md border border-gray-200 hover:border-[#c8793a] hover:text-[#c8793a] transition"><Navigation size={13} className="text-[#c8793a]" />Định vị của tôi</button></div>
            <iframe title="Coffee Shop locations" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31356.63!2d106.6836!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzM2LjgiTiAxMDbCsDQxJzAwLjgiRQ!5e0!3m2!1svi!2svn!4v1" className="w-full h-full border-0 min-h-[400px]" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className="absolute bottom-4 right-4 flex flex-col gap-1"><button className="w-8 h-8 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-[#c8793a]">+</button><button className="w-8 h-8 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-[#c8793a]">−</button></div>
          </div>
        </div>
      </section>
      <section className="bg-[#2c1a0e]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#c8793a] flex items-center justify-center shadow-xl flex-shrink-0"><Smartphone size={30} className="text-white" /></div>
              <div><h3 className="text-white font-extrabold text-xl mb-1">Đặt món dễ dàng hơn với ứng dụng Coffee Shop!</h3><p className="text-white/50 text-sm">Tích điểm, nhận ưu đãi và đặt hàng nhanh chóng</p></div>
            </div>
            <div className="flex gap-8">
              {APP_FEATURES.map((f, i) => (<div key={i} className="flex items-start gap-2.5"><div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">{f.icon}</div><div><p className="text-white font-semibold text-xs">{f.title}</p><p className="text-white/40 text-[10px] mt-0.5">{f.sub}</p></div></div>))}
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="#" className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 transition"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-white flex-shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg><div><p className="text-[9px] text-white/60 leading-none">Tải về trên</p><p className="font-bold text-[13px] leading-tight">App Store</p></div></a>
              <a href="#" className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 transition"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-white flex-shrink-0"><path d="M3.18 23.76c.3.17.64.24.99.2l12.5-7.22-2.8-2.8-10.69 9.82zm-1.4-21.1C1.6 3 1.5 3.4 1.5 3.9v16.2c0 .5.1.9.28 1.24l.07.07L10.7 12l-8.85-9.41-.07.07zm20.04 9.18L18.9 9.62l-3.08 3.08 3.08 3.08 2.94-1.7c.84-.49.84-1.26 0-1.74zm-10.49 1.06L1.78 22.32l.08.07c.31.3.72.41 1.15.26l12.65-7.31-3.33-3.54z"/></svg><div><p className="text-[9px] text-white/60 leading-none">Tải về trên</p><p className="font-bold text-[13px] leading-tight">Google Play</p></div></a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
