import React, { useEffect, useMemo, useState } from 'react';
import { categoriesAPI } from '../../api/categories.api';
import { Edit2, Loader2, Plus, Search, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CategoryModal = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState({ name: '', description: '', color: '#6F4E37' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({ name: initial.name || '', description: initial.description || '', color: initial.color || '#6F4E37' });
    } else {
      setForm({ name: '', description: '', color: '#6F4E37' });
    }
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        await categoriesAPI.update(initial.id, form);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await categoriesAPI.create(form);
        toast.success('Tạo danh mục thành công');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được danh mục');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-scale-in">
      <div className="bg-white rounded-3xl shadow-elevated w-full max-w-md p-6">
        <h3 className="font-bold text-coffee-900 text-lg mb-5">{initial?.id ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Tên danh mục *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="Espresso" />
          </div>
          <div>
            <label className="form-label">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="form-input resize-none" placeholder="Mô tả danh mục" />
          </div>
          <div>
            <label className="form-label">Màu sắc</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              <span className="text-sm text-gray-500 font-mono">{form.color}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Đang lưu...' : 'Lưu'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });

  const load = async () => {
    setLoading(true);
    try {
      const r = await categoriesAPI.getAll({ include_count: true });
      setCategories(r.data.data || []);
    } catch {
      toast.error('Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => categories.filter((cat) => cat.name?.toLowerCase().includes(search.toLowerCase())), [categories, search]);

  const handleDelete = async (catId, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"?`)) return;
    try {
      await categoriesAPI.delete(catId);
      toast.success('Xóa danh mục thành công');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Danh mục sản phẩm</h1>
          <p className="page-subtitle">{categories.length} danh mục</p>
        </div>
        <button type="button" onClick={() => setModal({ open: true, data: null })} className="btn-primary">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      <div className="card">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm danh mục..." className="form-input pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-coffee-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center text-coffee-400">
          <Tag size={40} className="mx-auto mb-3 text-coffee-200" />
          <p>{search ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div key={cat.id} className="card-stat group flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${cat.color || '#6F4E37'}18` }}>
                <Tag size={24} style={{ color: cat.color || '#6F4E37' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-coffee-900">{cat.name}</p>
                <p className="text-xs text-coffee-500 mt-0.5">{cat.product_count || 0} sản phẩm</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setModal({ open: true, data: cat })} className="p-2 hover:bg-coffee-100 text-coffee-400 hover:text-coffee-700 rounded-xl transition-colors">
                  <Edit2 size={16} />
                </button>
                <button type="button" onClick={() => handleDelete(cat.id, cat.name)} className="p-2 hover:bg-red-50 text-coffee-400 hover:text-red-600 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal open={modal.open} onClose={() => setModal({ open: false, data: null })} onSave={() => { setModal({ open: false, data: null }); load(); }} initial={modal.data} />
    </div>
  );
}
