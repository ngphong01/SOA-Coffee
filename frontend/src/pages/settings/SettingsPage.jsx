import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Save, Settings, Shield, Store, Users, Camera, Upload, Mail, Phone, MapPin, Globe, Clock } from "../../utils/icons";
import toast from 'react-hot-toast';
import { settingsAPI } from '../../api/settings.api';
import { useAuth } from '../../hooks/useAuth';

const tabs = [
  { id: 'general', label: 'Cài đặt chung', icon: Store },
  { id: 'roles', label: 'Phân quyền', icon: Shield },
  { id: 'users', label: 'Tài khoản', icon: Users },
];

const PERMISSIONS = [
  { key: 'products', label: 'Sản phẩm' },
  { key: 'categories', label: 'Danh mục' },
  { key: 'inventory', label: 'Kho hàng' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'payments', label: 'Thanh toán' },
  { key: 'customers', label: 'Khách hàng' },
  { key: 'employees', label: 'Nhân viên' },
  { key: 'analytics', label: 'Báo cáo' },
  { key: 'settings', label: 'Cài đặt' },
];

const ROLES_CONFIG = {
  super_admin: { label: 'Super Admin', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 border-red-200' },
  manager: { label: 'Quản lý', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  cashier: { label: 'Thu ngân', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  barista: { label: 'Pha chế', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  viewer: { label: 'Xem', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [generalForm, setGeneralForm] = useState({
    shop_name: 'Quán Cà Phê', address: '123 Đường Cà Phê, Quận 1, TP.HCM',
    phone: '0901234567', email: 'contact@coffeeshop.vn',
    timezone: 'Asia/Ho_Chi_Minh', currency: 'VND',
    open_time: '07:00', close_time: '22:00', tax_rate: '10',
  });
  const [roles, setRoles] = useState({});
  const [users, setUsers] = useState([]);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', avatar_url: '' });
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
      setAvatarPreview(user.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [generalRes, rolesRes, usersRes] = await Promise.allSettled([
          settingsAPI.getGeneral(),
          settingsAPI.getRoles(), settingsAPI.getUsers(),
        ]);
        if (generalRes.status === 'fulfilled' && generalRes.value.data?.data) setGeneralForm((prev) => ({ ...prev, ...generalRes.value.data.data }));
        if (rolesRes.status === 'fulfilled' && rolesRes.value.data?.data) setRoles(rolesRes.value.data.data);
        if (usersRes.status === 'fulfilled' && usersRes.value.data?.data) setUsers(usersRes.value.data.data);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const handleSaveGeneral = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await settingsAPI.updateGeneral(generalForm); toast.success('Đã lưu cài đặt chung'); } catch { toast.error('Không lưu được'); } finally { setSaving(false); }
  };
  const handleSaveRoles = async () => {
    setSaving(true);
    try { await settingsAPI.updateRoles(roles); toast.success('Đã lưu phân quyền'); } catch { toast.error('Không lưu được'); } finally { setSaving(false); }
  };
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const dataToSave = { ...profileForm };
      // Nếu là ảnh local (base64), upload lên server trước
      if (dataToSave.avatar_url && dataToSave.avatar_url.startsWith('data:')) {
        const uploadRes = await settingsAPI.uploadAvatar(dataToSave.avatar_url);
        const uploadedUrl = uploadRes.data?.data?.avatar_url;
        if (uploadedUrl) {
          dataToSave.avatar_url = uploadedUrl;
          setAvatarPreview(uploadedUrl);
          toast.success('Ảnh đã được tải lên');
        } else {
          toast.error('Upload ảnh thất bại, thử URL khác');
          setSaving(false);
          return;
        }
      }
      const res = await settingsAPI.updateProfile(dataToSave);
      const updatedUser = res.data?.data;
      if (updatedUser) {
        // Update Redux
        refreshUser(updatedUser);
        // Also update localStorage directly to ensure persistence
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
        // Update local form state
        setProfileForm({
          full_name: updatedUser.full_name || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          avatar_url: updatedUser.avatar_url || '',
        });
        setAvatarPreview(updatedUser.avatar_url || '');
      }
      toast.success('Đã cập nhật thông tin cá nhân');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không lưu được profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh quá lớn, tối đa 2MB'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await settingsAPI.uploadFile(formData);
      const avatarUrl = res.data?.data?.url;
      if (avatarUrl) {
        setProfileForm((prev) => ({ ...prev, avatar_url: avatarUrl }));
        setAvatarPreview(avatarUrl);
        toast.success('Đã upload ảnh! Bấm Cập nhật hồ sơ để lưu.');
      }
    } catch { toast.error('Upload ảnh thất bại, thử lại sau'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Cài đặt hệ thống</h1>
        <p className="page-subtitle">Quản lý cấu hình, phân quyền và thông báo</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-coffee-100 text-coffee-800 shadow-sm' : 'text-coffee-500 hover:bg-coffee-50 hover:text-coffee-700'
                }`}>
                <tab.icon size={17} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* ── General Tab ── */}
          {activeTab === 'general' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-bold text-coffee-900 flex items-center gap-2"><Store size={20} className="text-coffee-600" />Thông tin cửa hàng</h2>
              <form onSubmit={handleSaveGeneral} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'shop_name', label: 'Tên cửa hàng', icon: Store },
                    { key: 'email', label: 'Email liên hệ', type: 'email', icon: Mail },
                    { key: 'phone', label: 'Số điện thoại', icon: Phone },
                    { key: 'tax_rate', label: 'Thuế suất (%)', type: 'number' },
                    { key: 'open_time', label: 'Giờ mở cửa', type: 'time', icon: Clock },
                    { key: 'close_time', label: 'Giờ đóng cửa', type: 'time', icon: Clock },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="form-label">{field.label}</label>
                      <input type={field.type || 'text'} value={generalForm[field.key]} onChange={(e) => setGeneralForm({ ...generalForm, [field.key]: e.target.value })} className="form-input" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="form-label flex items-center gap-1.5"><MapPin size={14} />Địa chỉ</label>
                    <textarea value={generalForm.address} onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })} rows={2} className="form-input resize-none" />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1.5"><Globe size={14} />Múi giờ</label>
                    <select value={generalForm.timezone} onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })} className="form-input bg-white">
                      <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                      <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                      <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Đơn vị tiền tệ</label>
                    <select value={generalForm.currency} onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })} className="form-input bg-white">
                      <option value="VND">VND (₫)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}</button>
              </form>
            </div>
          )}

          {/* ── Roles Tab ── */}
          {activeTab === 'roles' && (
            <div className="card space-y-5">
              <div>
                <h2 className="text-lg font-bold text-coffee-900 flex items-center gap-2"><Shield size={20} className="text-coffee-600" />Ma trận phân quyền</h2>
                <p className="text-sm text-coffee-500 mt-1">Quyền truy cập theo vai trò trong hệ thống</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-coffee-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-coffee-50">
                      <th className="text-left p-3 font-semibold text-coffee-700">Module</th>
                      {Object.entries(ROLES_CONFIG).map(([role, cfg]) => (
                        <th key={role} className="p-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.color}`}>{cfg.label}</span></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coffee-50">
                    {PERMISSIONS.map((perm) => (
                      <tr key={perm.key} className="hover:bg-coffee-50/50 transition-colors">
                        <td className="p-3 font-medium text-coffee-700">{perm.label}</td>
                        {Object.keys(ROLES_CONFIG).map((role) => {
                          const perms = (roles[role]?.[perm.key]) || [];
                          return (
                            <td key={role} className="p-3 text-center">
                              <div className="flex justify-center gap-1.5">
                                {perms.includes('read') && <span className="w-7 h-7 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs flex items-center justify-center font-bold">R</span>}
                                {perms.includes('write') && <span className="w-7 h-7 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs flex items-center justify-center font-bold">W</span>}
                                {perms.includes('delete') && <span className="w-7 h-7 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs flex items-center justify-center font-bold">D</span>}
                                {perms.length === 0 && <span className="text-coffee-300">—</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={handleSaveRoles} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu phân quyền'}</button>
            </div>
          )}

          {/* ── Users / Profile Tab ── */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Profile card */}
              <div className="card space-y-5">
                <h2 className="text-lg font-bold text-coffee-900 flex items-center gap-2"><Users size={20} className="text-coffee-600" />Hồ sơ cá nhân</h2>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-coffee-400 to-coffee-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (profileForm.full_name || user?.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <button type="button" onClick={handleAvatarClick} className="text-xs text-coffee-500 hover:text-coffee-700 flex items-center gap-1 transition-colors">
                      <Upload size={12} /> Đổi ảnh
                    </button>
                  </div>

                  {/* Profile form */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="sm:col-span-2">
                      <label className="form-label">Họ và tên</label>
                      <input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="form-input" placeholder="Nhập họ tên" />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input value={profileForm.email} disabled className="form-input bg-coffee-50 text-coffee-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="form-label">Số điện thoại</label>
                      <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="form-input" placeholder="0901234567" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="form-label flex items-center gap-1.5"><Camera size={14} />URL ảnh đại diện</label>
                      <input value={profileForm.avatar_url} onChange={(e) => { setProfileForm({ ...profileForm, avatar_url: e.target.value }); setAvatarPreview(e.target.value); }} className="form-input" placeholder="https://..." />
                    </div>
                    <div className="sm:col-span-2">
                      <button type="button" onClick={handleSaveProfile} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users list */}
              <div className="card space-y-5">
                <h2 className="text-lg font-bold text-coffee-900 flex items-center gap-2"><Users size={20} className="text-coffee-600" />Danh sách tài khoản</h2>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-sm text-coffee-400 text-center py-8">Chưa có dữ liệu tài khoản từ backend.</p>
                  ) : users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-coffee-100 hover:bg-coffee-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700 font-bold text-sm">
                          {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-coffee-800 text-sm">{u.full_name || u.email}</p>
                          <p className="text-xs text-coffee-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-coffee-100 text-coffee-700 font-medium border border-coffee-200">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
