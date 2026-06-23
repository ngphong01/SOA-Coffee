import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Sparkles, Image, Upload } from 'lucide-react';
import { productsAPI } from '../../api/products.api';
import { categoriesAPI } from '../../api/categories.api';
import toast from 'react-hot-toast';

const flattenCategories = (cats, depth = 0) =>
  (cats || []).flatMap((c) => [
    { id: c.id, name: `${'— '.repeat(depth)}${c.name}` },
    ...flattenCategories(c.children, depth + 1),
  ]);

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      is_active: true,
      initial_stock: 0,
      min_stock_level: 5,
      reorder_point: 3,
      unit: 'cup',
      price: '',
      cost_price: '',
      image_url: '',
    },
  });

  const name = watch('name', '');
  const price = watch('price', 0);
  const costPrice = watch('cost_price', 0);
  const imageUrl = watch('image_url', '');

  const profitMargin = useMemo(() => {
    const p = Number(price || 0);
    const c = Number(costPrice || 0);
    if (!p || c <= 0) return null;
    return ((p - c) / p) * 100;
  }, [price, costPrice]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await categoriesAPI.getAll({ include_count: true });
        setCategories(flattenCategories(r.data.data || []));
      } catch {
        toast.error('Không tải được danh mục');
      }

      if (isEdit) {
        try {
          const r = await productsAPI.getOne(id);
          const p = r.data.data;
          reset({
            name: p.name || '',
            sku: p.sku || '',
            barcode: p.barcode || '',
            category_id: p.category_id || '',
            unit: p.unit || 'cup',
            description: p.description || '',
            price: p.price ?? '',
            cost_price: p.cost_price ?? '',
            is_active: Boolean(p.is_active ?? true),
            min_stock_level: p.min_stock_level ?? 5,
            reorder_point: p.reorder_point ?? 3,
            initial_stock: p.initial_stock ?? 0,
            image_url: p.image_url || p.thumbnail_url || '',
          });
        } catch {
          toast.error('Không tải được sản phẩm');
        }
      }
    };

    load();
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        category_id: Number(data.category_id),
        price: Number(data.price),
        cost_price: Number(data.cost_price || 0),
        min_stock_level: Number(data.min_stock_level || 0),
        reorder_point: Number(data.reorder_point || 0),
        initial_stock: Number(data.initial_stock || 0),
        is_active: Boolean(data.is_active),
      };

      if (isEdit) {
        await productsAPI.update(id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await productsAPI.create(payload);
        toast.success('Tạo sản phẩm thành công');
      }
      navigate('/admin/products');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không lưu được sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h1>
          <p className="text-sm text-gray-500">Tạo món bán chạy, quản lý SKU và tồn kho ngay từ đầu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={16} />Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Tên sản phẩm *</label>
              <input {...register('name', { required: 'Vui lòng nhập tên sản phẩm' })} className="form-input" placeholder="Cà phê sữa đá" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">SKU *</label>
              <input {...register('sku', { required: 'Vui lòng nhập SKU' })} className="form-input" placeholder="CF-SUA-001" />
              {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="form-label">Barcode</label>
              <input {...register('barcode')} className="form-input" placeholder="8931234567890" />
            </div>
            <div>
              <label className="form-label">Danh mục *</label>
              <select {...register('category_id', { required: 'Chọn danh mục' })} className="form-input">
                <option value="">Chọn danh mục</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
            </div>
            <div>
              <label className="form-label">Đơn vị</label>
              <select {...register('unit')} className="form-input">
                {['cup', 'glass', 'bottle', 'piece', 'box', 'kg', 'g', 'liter'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Mô tả</label>
              <textarea {...register('description')} rows={3} className="form-input resize-none" placeholder="Mô tả ngắn về sản phẩm" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label flex items-center gap-2"><Image size={16} /> Ảnh sản phẩm</label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <input {...register('image_url')} type="url" className="form-input" placeholder="https://example.com/images/ca-phe-sua.jpg" />
                  <p className="text-xs text-gray-400 mt-1">Nhập URL ảnh sản phẩm (jpg, png, webp)</p>
                </div>
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Xem trước" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <Upload size={24} className={`text-gray-300 ${imageUrl ? 'hidden' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Giá bán & lợi nhuận</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Giá bán (VNĐ) *</label>
              <input {...register('price', { required: 'Vui lòng nhập giá bán', min: 0 })} type="number" className="form-input" />
              {errors.price && <p className="text-red-500 text-xs mt-1">Giá bán không hợp lệ</p>}
            </div>
            <div>
              <label className="form-label">Giá vốn (VNĐ)</label>
              <input {...register('cost_price')} type="number" className="form-input" />
            </div>
          </div>
          {profitMargin !== null && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-gray-700">
              Biên lợi nhuận ước tính: <span className="font-semibold text-amber-800">{profitMargin.toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Thiết lập tồn kho</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!isEdit && (
              <div>
                <label className="form-label">Tồn kho ban đầu</label>
                <input {...register('initial_stock')} type="number" className="form-input" />
              </div>
            )}
            <div>
              <label className="form-label">Ngưỡng tối thiểu</label>
              <input {...register('min_stock_level')} type="number" className="form-input" />
            </div>
            <div>
              <label className="form-label">Ngưỡng đặt hàng lại</label>
              <input {...register('reorder_point')} type="number" className="form-input" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input {...register('is_active')} type="checkbox" className="rounded border-gray-300 text-amber-800" />
            <span className="text-sm font-medium">Kích hoạt bán hàng ngay</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save size={16} /> {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </div>
  );
}
