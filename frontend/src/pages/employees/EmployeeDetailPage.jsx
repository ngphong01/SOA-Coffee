import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Briefcase, CalendarDays, BadgeCheck, Pencil, Save, Camera, User } from "../../utils/icons";
import { employeesAPI } from '../../api/employees.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'barista', position: '', department: '', salary: '', hire_date: '', status: 'active', avatar_url: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await employeesAPI.getOne(id);
      const data = r.data.data || null;
      setEmployee(data);
      setForm({ full_name: data?.full_name || '', email: data?.email || '', phone: data?.phone || '', role: data?.role || 'barista', position: data?.position || '', department: data?.department || '', salary: data?.salary || '', hire_date: data?.hire_date ? String(data.hire_date).slice(0, 10) : '', status: data?.status || 'active', avatar_url: data?.avatar_url || '' });
    } catch {
      toast.error('Không tải được thông tin nhân viên');
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!employee) return <div className="card py-12 text-center text-coffee-500">Không tìm thấy nhân viên.</div>;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await employeesAPI.update(id, {
        ...form,
        salary: form.salary === '' ? null : Number(form.salary),
        avatar_url: form.avatar_url || null,
      });
      toast.success('Đã cập nhật nhân viên');
      await load();
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được nhân viên');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link to="/admin/employees" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <div className="flex-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt={employee.full_name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-200 shadow-sm"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-xl shadow-sm ${employee.avatar_url ? 'hidden' : ''}`}
              style={employee.avatar_url ? { display: 'none' } : {}}>
              {employee.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
              <p className="text-sm text-gray-500">{employee.employee_code || '—'}</p>
            </div>
          </div>
          <button type="button" onClick={() => setEditing((v) => !v)} className="btn-secondary"><Pencil size={16} /> {editing ? 'Hủy sửa' : 'Chỉnh sửa'}</button>
        </div>
      </div>

      {editing ? (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">Chỉnh sửa nhân viên</h2>
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSave}>
            <div><label className="form-label">Họ và tên</label><input className="form-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="form-label">Số điện thoại</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="form-label">Vai trò</label><select className="form-input bg-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="barista">Barista</option><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option><option value="viewer">Viewer</option></select></div>
            <div><label className="form-label">Chức danh</label><input className="form-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><label className="form-label">Phòng ban</label><input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><label className="form-label">Lương</label><input type="number" className="form-input" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
            <div><label className="form-label">Ngày vào làm</label><input type="date" className="form-input" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="form-label">Trạng thái</label><select className="form-input bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Đang làm</option><option value="on_leave">Nghỉ phép</option><option value="inactive">Nghỉ việc</option></select></div>
            <div className="sm:col-span-2">
              <label className="form-label flex items-center gap-1.5"><Camera size={14} /> URL ảnh đại diện</label>
              <div className="flex gap-3 items-start">
                <input className="form-input flex-1" value={form.avatar_url || ''} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg" />
                {form.avatar_url && (
                  <img src={form.avatar_url} alt="Preview" className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                )}
              </div>
            </div>
            <div className="sm:col-span-2 flex gap-3"><button className="btn-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button><button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Hủy</button></div>
          </form>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card"><p className="text-xs text-gray-500">Vai trò</p><p className="text-xl font-bold text-gray-900">{employee.role_display || employee.role || '-'}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Phòng ban</p><p className="text-xl font-bold text-gray-900">{employee.department || '-'}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Chức danh</p><p className="text-xl font-bold text-gray-900">{employee.position || '-'}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Trạng thái</p><div className="mt-1"><StatusBadge status={employee.status} /></div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card lg:col-span-2 space-y-4">
              <h2 className="font-bold text-gray-900">Thông tin liên hệ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3"><Mail size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Email</p><p className="font-medium">{employee.email || '-'}</p></div></div>
                <div className="flex items-start gap-3"><Phone size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Số điện thoại</p><p className="font-medium">{employee.phone || '-'}</p></div></div>
                <div className="flex items-start gap-3"><Briefcase size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Mã nhân viên</p><p className="font-medium">{employee.employee_code || '-'}</p></div></div>
                <div className="flex items-start gap-3"><CalendarDays size={16} className="text-gray-400 mt-0.5" /><div><p className="text-gray-500">Ngày vào làm</p><p className="font-medium">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('vi-VN') : '-'}</p></div></div>
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center gap-2"><BadgeCheck size={18} className="text-green-600" /><h2 className="font-bold text-gray-900">Lương & trạng thái</h2></div>
              <div>
                <p className="text-xs text-gray-500">Lương</p>
                <p className="text-2xl font-bold text-coffee-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(employee.salary || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trạng thái làm việc</p>
                <p className="font-medium capitalize">{employee.status || '-'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
