import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Save, Sparkles, Image, Upload,
  Tag, DollarSign, Package, Info,
  TrendingUp, AlertCircle, CheckCircle2
} from "../../utils/icons";
import { productsAPI } from '../../api/products.api';
import { categoriesAPI } from '../../api/categories.api';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';

const flattenCategories = (cats, depth = 0) =>
  (cats || []).flatMap((c) => [
    { id: c.id, name: `${'— '.repeat(depth)}${c.name}` },
    ...flattenCategories(c.children, depth + 1),
  ]);

const vnd = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5 tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-red-500 text-[11px] mt-1.5">
      <AlertCircle size={11} /> {message}
    </p>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-amber-700" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-[14px]">{title}</h3>
          {subtitle && <p className="text-gray-400 text-[11.5px]">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgPreviewErr, setImgPreviewErr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isDirty },
  } = useForm({
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

  const name      = watch('name', '');
  const price     = watch('price', 0);
  const costPrice = watch('cost_price', 0);
  const imageUrl  = watch('image_url', '');
  const isActive  = watch('is_active');

  const profitMargin = useMemo(() => {
    const p = Number(price || 0);
    const c = Number(costPrice || 0);
    if (!p || c <= 0) return null;
    return ((p - c) / p) * 100;
  }, [price, costPrice]);

  const profitColor =
    profitMargin === null ? ''
    : profitMargin >= 50  ? 'text-green-600'
    : profitMargin >= 25  ? 'text-amber-600'
    : 'text-red-500';

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
            name:            p.name            || '',
            sku:             p.sku             || '',
            barcode:         p.barcode         || '',
            category_id:     p.category_id     || '',
            unit:            p.unit            || 'cup',
            description:     p.description     || '',
            price:           p.price           ?? '',
            cost_price:      p.cost_price      ?? '',
            is_active:       Boolean(p.is_active ?? true),
            min_stock_level: p.min_stock_level ?? 5,
            reorder_point:   p.reorder_point   ?? 3,
            initial_stock:   p.initial_stock   ?? 0,
            image_url:       p.image_url || p.thumbnail_url || '',
          });
        } catch {
          toast.error('Không tải được sản phẩm');
        }
      }
    };
    load();
  }, [id, isEdit, reset]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isEdit) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/products/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data.data?.thumbnail_url;
      if (newUrl) {
        reset((prev) => ({ ...prev, image_url: newUrl }));
        setImgPreviewErr(false);
        toast.success('Tải ảnh lên thành công!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        category_id:     Number(data.category_id),
        price:           Number(data.price),
        cost_price:      Number(data.cost_price      || 0),
        min_stock_level: Number(data.min_stock_level || 0),
        reorder_point:   Number(data.reorder_point   || 0),
        initial_stock:   Number(data.initial_stock   || 0),
        is_active:       Boolean(data.is_active),
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
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     border border-gray-200 hover:border-amber-300 hover:bg-amber-50
                     text-gray-500 hover:text-amber-700 transition-all duration-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
            {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {isEdit
              ? `Đang sửa: ${name || '...'}`
              : 'Tạo món bán chạy, quản lý SKU và tồn kho ngay từ đầu'}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
          isActive
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-50 text-gray-400 border-gray-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          {isActive ? 'Đang bán' : 'Ngừng bán'}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <SectionCard
          icon={Sparkles}
          title="Thông tin cơ bản"
          subtitle="Tên, SKU, danh mục và mô tả sản phẩm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="sm:col-span-2">
              <FieldLabel required>Tên sản phẩm</FieldLabel>
              <input
                {...register('name', { required: 'Vui lòng nhập tên sản phẩm' })}
                className={`w-full px-4 py-2.5 rounded-xl border text-[13.5px] outline-none
                            transition-all duration-200 bg-gray-50 focus:bg-white
                            ${errors.name
                              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'}`}
                placeholder="Cà phê sữa đá"
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div>
              <FieldLabel required>SKU</FieldLabel>
              <input
                {...register('sku', { required: 'Vui lòng nhập SKU' })}
                className={`w-full px-4 py-2.5 rounded-xl border text-[13.5px] outline-none
                            transition-all duration-200 bg-gray-50 focus:bg-white font-mono
                            ${errors.sku
                              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'}`}
                placeholder="CF-SUA-001"
              />
              <FieldError message={errors.sku?.message} />
            </div>

            <div>
              <FieldLabel>Barcode</FieldLabel>
              <input
                {...register('barcode')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                           outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                           focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono"
                placeholder="8931234567890"
              />
            </div>

            <div>
              <FieldLabel required>Danh mục</FieldLabel>
              <select
                {...register('category_id', { required: 'Chọn danh mục' })}
                className={`w-full px-4 py-2.5 rounded-xl border text-[13.5px] outline-none
                            transition-all duration-200 bg-gray-50 focus:bg-white cursor-pointer
                            ${errors.category_id
                              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'}`}
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <FieldError message={errors.category_id?.message} />
            </div>

            <div>
              <FieldLabel>Đơn vị tính</FieldLabel>
              <select
                {...register('unit')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                           outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                           focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer"
              >
                {['cup', 'glass', 'bottle', 'piece', 'box', 'kg', 'g', 'liter'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Mô tả sản phẩm</FieldLabel>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                           outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                           focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none"
                placeholder="Mô tả ngắn về sản phẩm..."
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Ảnh sản phẩm</FieldLabel>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="relative">
                    <Image size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register('image_url')}
                      type="url"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200
                                 text-[13.5px] outline-none transition-all duration-200
                                 bg-gray-50 focus:bg-white focus:border-amber-400
                                 focus:ring-2 focus:ring-amber-100"
                      placeholder="https://example.com/images/ca-phe-sua.jpg"
                      onChange={() => setImgPreviewErr(false)}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[11.5px] text-gray-400 flex items-center gap-1">
                      <Info size={11} /> Nhập URL hoặc tải lên
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !isEdit}
                      className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5
                                  rounded-lg border transition-all duration-150
                                  ${!isEdit
                                    ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                    : 'text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-400'}`}
                      title={isEdit ? 'Tải ảnh lên' : 'Lưu sản phẩm trước khi tải ảnh'}
                    >
                      {uploading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <Upload size={12} /> Tải ảnh lên
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-[88px] h-[88px] rounded-2xl border-2 border-dashed border-gray-200
                                  flex items-center justify-center overflow-hidden bg-gray-50
                                  transition-all duration-200 hover:border-amber-300">
                    {imageUrl && !imgPreviewErr ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImgPreviewErr(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-gray-300">
                        <Upload size={22} />
                        <span className="text-[10px] font-medium">Preview</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* SECTION 2: GIÁ BÁN */}
        <SectionCard
          icon={DollarSign}
          title="Giá bán & lợi nhuận"
          subtitle="Thiết lập giá bán và theo dõi biên lợi nhuận"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel required>Giá bán (VNĐ)</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-amber-700">
                  ₫
                </span>
                <input
                  {...register('price', {
                    required: 'Vui lòng nhập giá bán',
                    min: { value: 0, message: 'Giá bán không hợp lệ' },
                  })}
                  type="number"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-[13.5px]
                              outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                              ${errors.price
                                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                : 'border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'}`}
                  placeholder="45000"
                />
              </div>
              {price > 0 && (
                <p className="text-[11.5px] text-amber-700 font-medium mt-1.5">
                  = {vnd(price)}
                </p>
              )}
              <FieldError message={errors.price?.message} />
            </div>

            <div>
              <FieldLabel>Giá vốn (VNĐ)</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">
                  ₫
                </span>
                <input
                  {...register('cost_price')}
                  type="number"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200
                             text-[13.5px] outline-none transition-all duration-200
                             bg-gray-50 focus:bg-white focus:border-amber-400
                             focus:ring-2 focus:ring-amber-100"
                  placeholder="15000"
                />
              </div>
              {Number(costPrice) > 0 && (
                <p className="text-[11.5px] text-gray-400 mt-1.5">= {vnd(costPrice)}</p>
              )}
            </div>
          </div>

          {profitMargin !== null && (
            <div className={`mt-5 rounded-xl p-4 flex items-center gap-4 border ${
              profitMargin >= 50  ? 'bg-green-50 border-green-100'
              : profitMargin >= 25 ? 'bg-amber-50 border-amber-100'
              : 'bg-red-50 border-red-100'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                profitMargin >= 50  ? 'bg-green-100'
                : profitMargin >= 25 ? 'bg-amber-100'
                : 'bg-red-100'
              }`}>
                <TrendingUp size={20} className={profitColor} />
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-gray-500 font-medium">Biên lợi nhuận ước tính</p>
                <p className={`text-[24px] font-extrabold leading-none mt-0.5 ${profitColor}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="text-right text-[12px] text-gray-400">
                <p>Lợi nhuận / sản phẩm</p>
                <p className={`font-bold text-[14px] mt-0.5 ${profitColor}`}>
                  {vnd(Number(price) - Number(costPrice))}
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* SECTION 3: TỒN KHO */}
        <SectionCard
          icon={Package}
          title="Thiết lập tồn kho"
          subtitle="Số lượng ban đầu và ngưỡng cảnh báo"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {!isEdit && (
              <div>
                <FieldLabel>Tồn kho ban đầu</FieldLabel>
                <input
                  {...register('initial_stock')}
                  type="number"
                  min={0}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                             outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                             focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            )}
            <div>
              <FieldLabel>Ngưỡng tối thiểu</FieldLabel>
              <input
                {...register('min_stock_level')}
                type="number"
                min={0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                           outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                           focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Cảnh báo tồn kho thấp</p>
            </div>
            <div>
              <FieldLabel>Ngưỡng đặt hàng lại</FieldLabel>
              <input
                {...register('reorder_point')}
                type="number"
                min={0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px]
                           outline-none transition-all duration-200 bg-gray-50 focus:bg-white
                           focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Tự động nhắc nhập hàng</p>
            </div>
          </div>

          {/* Toggle kích hoạt */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-[13.5px] font-semibold text-gray-800">Kích hoạt bán hàng</p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Sản phẩm sẽ hiển thị trên menu và có thể đặt mua
                </p>
              </div>
              <div className="relative">
                <input {...register('is_active')} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-amber-500 rounded-full
                                transition-colors duration-200 peer-focus:ring-2
                                peer-focus:ring-amber-300 cursor-pointer" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                                transition-transform duration-200 peer-checked:translate-x-5
                                pointer-events-none" />
              </div>
            </label>
          </div>
        </SectionCard>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800
                       disabled:bg-amber-400 disabled:cursor-not-allowed
                       text-white font-bold text-[13.5px] px-6 py-3 rounded-xl
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                       shadow-md shadow-amber-700/20"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={15} />
                {isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 border-2 border-gray-200 hover:border-gray-300
                       text-gray-600 hover:text-gray-800 font-semibold text-[13.5px]
                       px-6 py-3 rounded-xl transition-all duration-200"
          >
            Hủy bỏ
          </button>
          {isDirty && (
            <p className="text-[12px] text-amber-600 flex items-center gap-1.5 ml-auto">
              <AlertCircle size={13} />
              Có thay đổi chưa được lưu
            </p>
          )}
        </div>

      </form>
    </div>
  );
}
