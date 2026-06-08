import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeesAPI } from '../../api/employees.api';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Edit2, Eye, Plus, Search, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeModal = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'barista',
    position: '',
    department: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        full_name: initial.full_name || '',
        email: initial.email || '',
        phone: initial.phone || '',
        role: initial.role || 'barista',
        position: initial.position || '',
        department: initial.department || '',
        salary: initial.salary || '',
        hire_date: initial.hire_date ? String(initial.hire_date).slice(0, 10) : new Date().toISOString().split('T')[0],
        status: initial.status || 'active',
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error('Vui lòng nhập tên nhân viên');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        await employeesAPI.update(initial.id, form);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await employeesAPI.create(form);
        toast.success('Tạo nhân viên thành công');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được nhân viên');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 text-lg mb-5">{initial?.id ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}</h3>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Họ và tên *</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="form-input" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" placeholder="email@example.com" />
            </div>
            <div>
              <label className="form-label">Số điện thoại</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" placeholder="0912345678" />
            </div>
            <div>
              <label className="form-label">Vai trò</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-input bg-white">
                <option value="barista">Barista</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="form-label">Chức danh</label>
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="form-input" placeholder="Shift Lead" />
            </div>
            <div>
              <label className="form-label">Phòng ban</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="form-input" placeholder="Vận hành" />
            </div>
            <div>
              <label className="form-label">Lương</label>
              <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="form-input" placeholder="5000000" />
            </div>
            <div>
              <label className="form-label">Ngày vào làm</label>
              <input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input bg-white">
                <option value="active">Đang làm</option>
                <option value="on_leave">Nghỉ phép</option>
                <option value="inactive">Nghỉ việc</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });

  const load = async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([
        employeesAPI.getAll({ search, status: statusFilter, limit: 1000 }),
        employeesAPI.getStats(),
      ]);
      setEmployees(eRes.data.data || []);
      setStats(sRes.data.data || null);
    } catch {
      toast.error('Không tải được nhân viên');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const filtered = useMemo(() => employees, [employees]);

  const columns = [
    {
      key: 'full_name', label: 'Nhân viên',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          {row.avatar_url ? (
            <img src={row.avatar_url} alt={v} className="w-10 h-10 rounded-full object-cover border-2 border-amber-200"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          ) : null}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ${row.avatar_url ? 'hidden' : ''}`}>
            {v?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm font-sans">{v}</p>
            <p className="text-xs text-gray-500 font-sans">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'employee_code', label: 'Mã', render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{v || '-'}</span> },
    { key: 'position', label: 'Chức danh', render: (v) => v || '-' },
    { key: 'department', label: 'Phòng ban', render: (v) => v || '-' },
    { key: 'role_display', label: 'Vai trò' },
    { key: 'hire_date', label: 'Ngày vào làm', render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '-') },
    { key: 'status', label: 'Trạng thái', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/employees/${row.id}`} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg inline-flex items-center gap-1">
            <Eye size={14} /> Xem chi tiết
          </Link>
          <button type="button" onClick={() => setModal({ open: true, data: row })} className="px-3 py-1.5 text-xs border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1">
            <Edit2 size={14} /> Sửa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Nhân viên</h1>
          <p className="text-sm text-gray-500">Quản lý nhân sự, vai trò và trạng thái làm việc</p>
        </div>
        <button type="button" onClick={() => setModal({ open: true, data: null })} className="btn-primary"><Plus size={16} /> Thêm nhân viên</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tổng', value: stats.total, color: 'bg-blue-600' },
            { label: 'Đang làm', value: stats.active, color: 'bg-green-600' },
            { label: 'Nghỉ phép', value: stats.on_leave, color: 'bg-yellow-500' },
            { label: 'Nghỉ việc', value: stats.inactive, color: 'bg-gray-400' },
          ].map((s, i) => (
            <div key={i} className="card flex items-center gap-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                <UserCheck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-xl">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc email..." className="form-input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-auto min-w-36 bg-white">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang làm</option>
          <option value="on_leave">Nghỉ phép</option>
          <option value="inactive">Nghỉ việc</option>
        </select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Không có nhân viên." />

      <EmployeeModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSave={() => { setModal({ open: false, data: null }); load(); }} initial={modal.data} />
    </div>
  );
}
