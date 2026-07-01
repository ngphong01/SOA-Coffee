import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, Facebook, Instagram, Linkedin } from "../../utils/icons";

const VALUES = [
  { icon: (<svg viewBox="0 0 40 40" fill="none" className="w-8 h-8"><path d="M20 8C14 8 10 13 10 18C10 24 14 28 20 28C26 28 30 24 30 18C30 13 26 8 20 8Z" stroke="#c8793a" strokeWidth="1.8" fill="rgba(200,121,58,0.08)"/><path d="M20 8C20 8 16 14 16 20" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 12C16 15 18 18 16 22" stroke="#c8793a" strokeWidth="1.2" strokeLinecap="round"/></svg>), title: 'Chất lượng hàng đầu', desc: 'Chúng tôi cam kết mang đến những sản phẩm chất lượng từ nguyên liệu tốt nhất.' },
  { icon: (<svg viewBox="0 0 40 40" fill="none" className="w-8 h-8"><path d="M20 30C20 30 8 22 8 14C8 10 11 7 15 7C17.5 7 19.5 8.5 20 10C20.5 8.5 22.5 7 25 7C29 7 32 10 32 14C32 22 20 30 20 30Z" stroke="#c8793a" strokeWidth="1.8" fill="rgba(200,121,58,0.08)"/></svg>), title: 'Tận tâm phục vụ', desc: 'Khách hàng là trung tâm trong mọi hoạt động, chúng tôi luôn phục vụ bằng cả trái tim.' },
  { icon: (<svg viewBox="0 0 40 40" fill="none" className="w-8 h-8"><path d="M20 6 L20 14 M12 10 L18 14 M28 10 L22 14" stroke="#c8793a" strokeWidth="1.8" strokeLinecap="round"/><circle cx="20" cy="20" r="8" stroke="#c8793a" strokeWidth="1.8" fill="rgba(200,121,58,0.08)"/><path d="M14 28 Q20 34 26 28" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/></svg>), title: 'Bền vững', desc: 'Chúng tôi cam kết phát triển bền vững và thiện thân với môi trường.' },
  { icon: (<svg viewBox="0 0 40 40" fill="none" className="w-8 h-8"><circle cx="14" cy="16" r="5" stroke="#c8793a" strokeWidth="1.8"/><circle cx="26" cy="16" r="5" stroke="#c8793a" strokeWidth="1.8"/><path d="M6 30C6 25 9.6 22 14 22" stroke="#c8793a" strokeWidth="1.8" strokeLinecap="round"/><path d="M26 22C30.4 22 34 25 34 30" stroke="#c8793a" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 22H23" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/></svg>), title: 'Kết nối cộng đồng', desc: 'Coffee Shop là nơi kết nối những người yêu cà phê và chia sẻ niềm đam mê.' },
];

const BIG_STATS = [
  { value: '5+', label: 'Năm kinh nghiệm' }, { value: '12+', label: 'Cửa hàng toàn quốc' },
  { value: '500K+', label: 'Khách hàng hài lòng' }, { value: '1M+', label: 'Tách cà phê đã phục vụ' },
];

const TEAM = [
  { name: 'Nguyễn Hoàng Nam', role: 'Nhà sáng lập', img: 'https://i.pravatar.cc/200?img=11' },
  { name: 'Trần Thúy Linh', role: 'Quản lý vận hành', img: 'https://i.pravatar.cc/200?img=47' },
  { name: 'Lê Minh Khôi', role: 'Chuyên gia pha chế', img: 'https://i.pravatar.cc/200?img=12' },
  { name: 'Phạm Ngọc Hà', role: 'Marketing Manager', img: 'https://i.pravatar.cc/200?img=48' },
];

const CTA_FEATURES = [
  { icon: '🌿', label: 'Nguyên liệu\nchất lượng' }, { icon: '☕', label: 'Pha chế\nchuẩn vị' },
  { icon: '🪑', label: 'Không gian\nấm cúng' }, { icon: '💝', label: 'Dịch vụ\ntận tâm' },
];

export default function AboutPage() {
  const [videoOpen, setVideoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 text-[#c8793a] text-sm font-semibold italic mb-3"><svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><circle cx="9" cy="9" r="7" stroke="#c8793a" strokeWidth="1.5"/><path d="M9 5v4l2 2" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/></svg>Về chúng tôi</div>
              <h1 className="text-[38px] lg:text-[46px] font-extrabold text-[#2c1a0e] leading-tight mb-4">Câu chuyện về<br />Coffee Shop</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">Coffee Shop được thành lập với niềm đam mê mang đến những tách cà phê chất lượng cùng trải nghiệm tuyệt vời cho khách hàng.</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">Chúng tôi tin rằng mỗi tách cà phê ngon không chỉ đánh thức vị giác mà còn kết nối con người và tạo nên những khoảnh khắc đáng nhớ.</p>
              <button onClick={() => setVideoOpen(true)} className="flex items-center gap-2 bg-[#2c1a0e] hover:bg-[#c8793a] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 text-sm"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Play size={12} fill="white" /></div>Xem hành trình của chúng tôi</button>
            </div>
            <div className="relative">
              <div className="relative h-80 rounded-3xl overflow-hidden shadow-2xl"><img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80" alt="Coffee Shop interior" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#1a0d04]/40 to-transparent" /><div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-center shadow"><p className="text-[#c8793a] font-extrabold text-xl leading-none">COFFEE</p><p className="text-[#c8793a] font-extrabold text-xl leading-none">SHOP</p><p className="text-gray-400 text-xs mt-1">EST. 2019</p></div></div>
              <div className="absolute -bottom-4 -left-4 w-36 h-32 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-1.5 rotate-[-3deg]"><img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=80" alt="Coffee" className="w-full h-[80%] object-cover rounded-xl" /><p className="text-center text-[9px] text-gray-400 mt-1 italic">Được làm bằng cả trái tim ♡</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4"><div className="h-52 rounded-2xl overflow-hidden shadow-md"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div><div className="h-52 rounded-2xl overflow-hidden shadow-md mt-6"><img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80" alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div></div>
            <div>
              <p className="text-[#c8793a] text-xs font-extrabold uppercase tracking-widest mb-2">CÂU CHUYỆN CỦA CHÚNG TÔI</p>
              <h2 className="text-[28px] font-extrabold text-[#2c1a0e] leading-tight mb-4">Khởi nguồn từ tình yêu với cà phê</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">Xuất phát là một quán cà phê nhỏ vào năm 2019, Coffee Shop đã không ngừng nỗ lực để mang đến những sản phẩm chất lượng và dịch vụ tận tâm nhất.</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">Từ những hạt cà phê được tuyển chọn kỹ lưỡng đến không gian ấm cùng, mỗi chi tiết đều được chúng tôi chăm chút để bạn có thể tận hưởng những giây phút thư giãn trọn vẹn.</p>
              <Link to="/menu" className="inline-flex items-center gap-2 border border-[#c8793a] text-[#c8793a] font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#c8793a] hover:text-white transition">Tìm hiểu thêm về hành trình của chúng tôi →</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 py-14">
        <p className="text-center text-[#c8793a] text-xs font-extrabold uppercase tracking-widest mb-2">GIÁ TRỊ CỦA CHÚNG TÔI</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {VALUES.map((v, i) => (<div key={i} className="flex flex-col items-center text-center group"><div className="w-16 h-16 rounded-full bg-[#fdf0e0] flex items-center justify-center mb-4 group-hover:bg-[#fde8cc] group-hover:scale-110 transition-all shadow-sm">{v.icon}</div><h3 className="font-bold text-[#2c1a0e] text-[14px] mb-2">{v.title}</h3><p className="text-gray-400 text-xs leading-relaxed">{v.desc}</p></div>))}
        </div>
      </section>
      <section className="bg-[#2c1a0e]"><div className="max-w-7xl mx-auto px-6 py-10"><div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{BIG_STATS.map((s, i) => (<div key={i} className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-[#c8793a]/20 flex items-center justify-center flex-shrink-0"><svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><path d="M3 7h9l-1.3 7H4.3L3 7z" stroke="#c8793a" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 8h1.5a1.5 1.5 0 0 1 0 3H12" stroke="#c8793a" strokeWidth="1.5" strokeLinecap="round"/></svg></div><div><p className="text-white font-extrabold text-2xl leading-none">{s.value}</p><p className="text-white/40 text-xs mt-1">{s.label}</p></div></div>))}</div></div></section>
      <section className="max-w-7xl mx-auto px-6 py-14">
        <p className="text-center text-[#c8793a] text-xs font-extrabold uppercase tracking-widest mb-1">ĐỘI NGŨ CỦA CHÚNG TÔI</p>
        <h2 className="text-center text-[24px] font-extrabold text-[#2c1a0e] mb-8">Những con người tạo nên Coffee Shop</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((t, i) => (<div key={i} className="group text-center"><div className="relative mb-3 overflow-hidden rounded-2xl shadow-md"><img src={t.img} alt={t.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" /><div className="absolute inset-0 bg-[#2c1a0e]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">{[{Icon:Facebook,href:'#'},{Icon:Instagram,href:'#'},{Icon:Linkedin,href:'#'}].map(({Icon,href},j)=>(<a key={j} href={href} className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#c8793a] flex items-center justify-center transition"><Icon size={13} className="text-white"/></a>))}</div></div><h3 className="font-bold text-[#2c1a0e] text-[14px]">{t.name}</h3><p className="text-gray-400 text-xs mt-0.5">{t.role}</p><div className="flex justify-center gap-2 mt-2">{[Facebook, Instagram, Linkedin].map((Icon,j)=>(<a key={j} href="#" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-[#c8793a] flex items-center justify-center transition"><Icon size={11} className="text-gray-500 hover:text-white"/></a>))}</div></div>))}
        </div>
      </section>
      <section className="bg-[#2c1a0e] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1400&q=80')",backgroundSize:'cover'}}/>
        <div className="relative max-w-7xl mx-auto px-6 py-10"><div className="flex flex-col lg:flex-row items-center justify-between gap-8"><div><h2 className="text-white font-extrabold text-2xl mb-2">Cùng Coffee Shop tận hưởng những khoảnh khắc tuyệt vời!</h2><Link to="/menu" className="inline-flex items-center gap-2 bg-[#c8793a] hover:bg-[#b5692a] text-white font-bold px-6 py-3 rounded-full transition hover:scale-105 text-sm mt-3 shadow-lg">Khám phá menu <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{CTA_FEATURES.map((f,i)=>(<div key={i} className="flex flex-col items-center gap-2 text-center"><div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">{f.icon}</div><p className="text-white/70 text-[11px] font-medium whitespace-pre leading-tight">{f.label}</p></div>))}</div></div></div>
      </section>
    </div>
  );
}
