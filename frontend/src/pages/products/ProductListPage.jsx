import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct } from '../../store/slices/productSlice';
import {
  Plus, Search, Edit, Trash2, Package,
  Filter, RefreshCw, Coffee, TrendingUp, X
} from "../../utils/icons";
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

// ── Stat card nhỏ đầu trang ──
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-[22px] font-extrabold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[11.5px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ProductListPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector((s) => s.products);

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'
  const [deleting,   setDeleting]   = useState(null);

  const load = () => {
    dispatch(fetchProducts({
      page,
      limit: 15,
      search,
      is_active: statusFilter === '' ? undefined
               : statusFilter === 'active' ? true : false,
    }));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [page, search, statusFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa sản phẩm "${name}"?\nHành động này không thể hoàn tác.`)) return;
    setDeleting(id);
    const result = await dispatch(deleteProduct(id));
    setDeleting(null);
    if (deleteProduct.fulfilled.match(result)) {
      toast.success(`Đã xóa "${name}"`);
      load();
    } else {
      toast.error(result.payload || 'Xóa thất bại');
    }
  };

  // ── Tính quick stats từ items ──
  const activeCount   = items.filter((i) => i.is_active).length;
  const lowStockCount = items.filter(
    (i) => i.quantity_available != null && i.quantity_available <= (i.min_stock_level ?? 5)
  ).length;

  const columns = [
    {
      key: 'thumbnail_url',
      label: 'Sản phẩm',
      render: (url, row) => (
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100
                          flex items-center justify-center overflow-hidden flex-shrink-0">
            {url ? (
              <img
                src={url}
                alt={row.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-full h-full items-center justify-center"
              style={{ display: url ? 'none' : 'flex' }}
            >
              <Coffee size={16} className="text-amber-400" />
            </div>
          </div>
          {/* Info */}
          <div>
            <p className="font-semibold text-gray-900 text-[13.5px] leading-tight">
              {row.name}
            </p>
            <p className="text-[11.5px] text-gray-400 font-mono mt-0.5">{row.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Danh mục',
      render: (v) => v
        ? <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[12px]
                           font-medium rounded-full">{v}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'price',
      label: 'Giá bán',
      render: (v) => (
        <span className="font-bold text-amber-700 text-[13.5px]">
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: 'quantity_available',
      label: 'Tồn kho',
      render: (v, row) => {
        const low = v != null && v <= (row.min_stock_level ?? 5);
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-[13.5px] ${low ? 'text-red-500' : 'text-gray-800'}`}>
              {v ?? '—'}
            </span>
            {low && v != null && (
              <span className="text-[10px] bg-red-50 text-red-500 border border-red-100
                               px-1.5 py-0.5 rounded-full font-semibold">
                Thấp
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Trạng thái',
      render: (v) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          text-[12px] font-semibold border ${
          v
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-50 text-gray-400 border-gray-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-green-500' : 'bg-gray-300'}`} />
          {v ? 'Đang bán' : 'Ngừng bán'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <Link
            to={`/admin/products/${row.id}/edit`}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-amber-700 hover:bg-amber-50
                       transition-all duration-150"
            title="Chỉnh sửa"
          >
            <Edit size={14} />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row.id, row.name)}
            disabled={deleting === row.id}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-red-600 hover:bg-red-50
                       transition-all duration-150 disabled:opacity-40"
            title="Xóa"
          >
            {deleting === row.id ? (
              <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600
                               rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
            Sản phẩm
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Quản lý toàn bộ menu và tồn kho
          </p>
        </div>
        <Link
          to="/admin/products/create"
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800
                     text-white font-bold text-[13.5px] px-5 py-2.5 rounded-xl
                     transition-all duration-200 hover:scale-[1.02] shadow-md
                     shadow-amber-700/20"
        >
          <Plus size={15} />
          Thêm sản phẩm
        </Link>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Tổng sản phẩm"
          value={pagination.total ?? 0}
          sub="trong hệ thống"
          color="text-gray-900"
        />
        <StatCard
          label="Đang bán"
          value={activeCount}
          sub={`/ ${items.length} hiển thị`}
          color="text-green-600"
        />
        <StatCard
          label="Tồn kho thấp"
          value={lowStockCount}
          sub="cần nhập thêm"
          color={lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'}
        />
        <StatCard
          label="Ngừng bán"
          value={items.filter((i) => !i.is_active).length}
          sub="sản phẩm"
          color="text-gray-400"
        />
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên, SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200
                         text-[13.5px] outline-none transition-all bg-gray-50
                         focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {[
              { v: '',         label: 'Tất cả'     },
              { v: 'active',   label: 'Đang bán'   },
              { v: 'inactive', label: 'Ngừng bán'  },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => { setStatusFilter(f.v); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-[12.5px] font-semibold border
                            transition-all duration-150 ${
                  statusFilter === f.v
                    ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={load}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200
                       text-gray-400 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50
                       transition-all duration-150 flex-shrink-0"
            title="Làm mới"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="Không tìm thấy sản phẩm nào."
      />
    </div>
  );
}
