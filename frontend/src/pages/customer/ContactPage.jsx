import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Mail, Phone, Globe, Send, ChevronDown, ChevronUp, Shield, Heart, Zap, ArrowRight, Facebook } from "../../utils/icons";
import toast from 'react-hot-toast';

const CONTACT_INFO = [
  { icon: MapPin, title: 'Địa chỉ trụ sở', lines: ['123 Nguyễn Huệ, Quận 1,', 'TP. Hồ Chí Minh, Việt Nam'] },
  { icon: Clock, title: 'Giờ làm việc', lines: ['06:00 – 22:00', '(Tất cả các ngày trong tuần)'] },
  { icon: Mail, title: 'Email', lines: ['support@coffeeshop.com'] },
  { icon: Phone, title: 'Hotline', lines: ['(028) 1234 5678'] },
  { icon: Globe, title: 'Website', lines: ['www.coffeeshop.com'] },
];

const HERO_CONTACTS = [
  { icon: Phone, title: 'Hotline', lines: ['(028) 1234 5678', '06:00 – 22:00 (Tất cả các ngày)'] },
  { icon: Mail, title: 'Email', lines: ['support@coffeeshop.com', 'Chúng tôi sẽ phản hồi trong 24h'] },
  { icon: Facebook, title: 'Fanpage', lines: ['fb.com/coffeeshop.vn', 'Kết nối với chúng tôi trên Facebook'] },
];

const SUPPORT_FEATURES = [
  { icon: <Zap size={18} className="text-[#c8793a]"/>, title: 'Phản hồi nhanh chóng', sub: 'Chúng tôi cam kết phản hồi trong 24h' },
  { icon: <Heart size={18} className="text-[#c8793a]"/>, title: 'Hỗ trợ tận tâm', sub: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn' },
  { icon: <Shield size={18} className="text-[#c8793a]"/>, title: 'Bảo mật thông tin', sub: 'Thông tin của bạn được bảo mật tuyệt đối' },
];

const SUBJECTS = ['Chọn chủ đề','Đặt hàng & Giao hàng','Sản phẩm & Menu','Thanh toán & Hóa đơn','Tài khoản & Thành viên','Góp ý & Khiếu nại','Hợp tác kinh doanh','Khác'];

const FAQS = [
  { q: 'Coffee Shop có giao hàng tận nơi không?', a: 'Có! Chúng tôi hỗ trợ giao hàng tận nơi các khu vực có đối tác vận chuyển. Bạn có thể đặt hàng trực tiếp trên website hoặc ứng dụng của chúng tôi.' },
  { q: 'Thời gian giao hàng mất bao lâu?', a: 'Thời gian giao hàng dự kiến từ 30 – 60 phút tùy theo khu vực của bạn.' },
  { q: 'Coffee Shop có chương trình tích điểm không?', a: 'Có! Khi đăng ký thành viên, bạn sẽ được tích điểm và nhận nhiều ưu đãi hấp dẫn.' },
  { q: 'Tôi có thể đặt bàn trước tại cửa hàng không?', a: 'Có, bạn có thể đặt bàn trước qua hotline hoặc fanpage của chúng tôi.' },
  { q: 'Chính sách đổi trả như thế nào?', a: 'Chúng tôi hỗ trợ đổi hoặc hoàn tiền nếu sản phẩm gặp vấn đề về chất lượng.' },
  { q: 'Làm thế nào để hợp tác với Coffee Shop?', a: 'Vui lòng gửi email đến support@coffeeshop.com với thông tin chi tiết về đề xuất hợp tác.' },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white mb-3 hover:border-amber-200 transition">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left"><span className="font-semibold text-[#2c1a0e] text-sm">{faq.q}</span>{open ? <ChevronUp size={16} className="text-[#c8793a] flex-shrink-0 ml-3" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-3" />}</button>
      {open && <div className="px-5 pb-4 border-t border-gray-50"><p className="text-gray-500 text-sm leading-relaxed pt-3">{faq.a}</p></div>}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'Chọn chủ đề', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    if (form.subject === 'Chọn chủ đề') { toast.error('Vui lòng chọn chủ đề'); return; }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success('Gửi tin nhắn thành công! 🎉');
    setForm({ name: '', email: '', phone: '', subject: 'Chọn chủ đề', message: '' });
    setSending(false);
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#c8793a] focus:ring-2 focus:ring-[#c8793a]/10 transition placeholder-gray-300 text-[#2c1a0e] bg-white";

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-[#c8793a] text-sm font-semibold italic mb-3"><Mail size={14} /> Liên hệ với chúng tôi</div>
              <h1 className="text-[36px] lg:text-[44px] font-extrabold text-[#2c1a0e] leading-tight mb-4">Chúng tôi luôn sẵn sàng<br />lắng nghe từ bạn!</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">Mọi thắc mắc, góp ý hay yêu cầu hợp tác, vui lòng liên hệ với Coffee Shop.</p>
              <div className="space-y-3">{SUPPORT_FEATURES.map((f,i)=>(<div key={i} className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">{f.icon}</div><div><p className="font-bold text-[#2c1a0e] text-sm">{f.title}</p><p className="text-gray-400 text-xs mt-0.5">{f.sub}</p></div></div>))}</div>
            </div>
            <div className="relative">
              <div className="h-72 rounded-3xl overflow-hidden shadow-2xl"><img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80" alt="Coffee Shop" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#1a0d04]/50 to-transparent rounded-3xl" /></div>
              <div className="absolute top-4 right-[-20px] space-y-2 hidden lg:block">{HERO_CONTACTS.map((c,i)=>(<div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 flex items-start gap-3 w-56"><div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><c.icon size={15} className="text-[#c8793a]"/></div><div className="min-w-0"><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{c.title}</p>{c.lines.map((l,j)=>(<p key={j} className={'text-xs '+(j===0?'font-bold text-[#2c1a0e]':'text-gray-400')+' leading-snug'}>{l}</p>))}</div></div>))}</div>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
            <h2 className="font-extrabold text-[#2c1a0e] text-lg mb-5">Gửi tin nhắn cho chúng tôi</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Họ và tên <span className="text-red-400">*</span></label><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Họ và tên" className={inputCls}/></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Email <span className="text-red-400">*</span></label><input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="Email" className={inputCls}/></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Số điện thoại</label><input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Số điện thoại" className={inputCls}/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Chủ đề <span className="text-red-400">*</span></label><div className="relative"><select value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})} className={inputCls+' appearance-none pr-9 cursor-pointer'}>{SUBJECTS.map((s)=><option key={s}>{s}</option>)}</select><ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Nội dung tin nhắn <span className="text-red-400">*</span></label><textarea value={form.message} onChange={(e)=>setForm({...form,message:e.target.value})} rows={4} placeholder="Nhập nội dung bạn muốn gửi..." className={inputCls+' resize-none'}/></div>
              <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 bg-[#c8793a] hover:bg-[#b5692a] text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-60 hover:scale-[1.02]">{sending ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/>Đang gửi...</> : <><Send size={16}/>Gửi tin nhắn</>}</button>
            </form>
          </div>
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-extrabold text-[#2c1a0e] text-base mb-4">Thông tin liên hệ</h3>
              <div className="space-y-4">{CONTACT_INFO.map(({icon:Icon,title,lines},i)=>(<div key={i} className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-[#c8793a]"/></div><div><p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{title}</p>{lines.map((l,j)=>(<p key={j} className={'text-sm leading-snug '+(j===0?'font-semibold text-[#2c1a0e]':'text-gray-400')}>{l}</p>))}</div></div>))}</div>
            </div>
            <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 h-52">
              <iframe title="Coffee Shop map" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177!2d106.7009!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzM2LjgiTiAxMDbCsDQyJzAzLjIiRQ!5e0!3m2!1svi!2svn!4v1" className="w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
              <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white text-[#2c1a0e] text-xs font-semibold px-3 py-2 rounded-xl shadow border border-gray-200 hover:text-[#c8793a] hover:border-[#c8793a] transition"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Chỉ đường đến chúng tôi</a>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-5"><h2 className="text-[18px] font-extrabold text-[#2c1a0e]">Câu hỏi thường gặp</h2><Link to="/faq" className="text-[#c8793a] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">Xem tất cả câu hỏi <ArrowRight size={15}/></Link></div>
        <div className="grid lg:grid-cols-2 gap-4"><div>{FAQS.slice(0,3).map((f,i)=><FAQItem key={i} faq={f}/>)}</div><div>{FAQS.slice(3,6).map((f,i)=><FAQItem key={i} faq={f}/>)}</div></div>
      </section>
      <section className="relative overflow-hidden"><div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage:"url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1400&q=80')"}}/><div className="relative bg-[#2c1a0e]/95 py-10"><div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-6"><div><h2 className="text-white font-extrabold text-xl mb-1">Đừng bỏ lỡ những ưu đãi hấp dẫn!</h2><p className="text-white/50 text-sm">Đăng ký nhận tin để cập nhật menu mới, chương trình khuyến mãi và tin tức từ Coffee Shop.</p></div><form onSubmit={(e)=>{e.preventDefault();toast.success('Đăng ký thành công! 🎉');e.target.reset()}} className="flex gap-2 flex-shrink-0"><input type="email" required placeholder="Nhập email của bạn" className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[#c8793a] transition min-w-[220px]"/><button type="submit" className="flex items-center gap-1.5 bg-[#c8793a] hover:bg-[#b5692a] text-white font-bold px-5 py-3 rounded-xl transition"><Send size={15}/>Đăng ký</button></form></div></div></section>
    </div>
  );
}
