import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct } from '../../store/slices/productSlice';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function ProductListPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector((s) => s.products);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchProducts({ page, limit: 15, search }));
    }, 300);
    return () => clearTimeout(t);
  }, [dispatch, page, search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa "${name}"?`)) return;
    const result = await dispatch(deleteProduct(id));
    if (deleteProduct.fulfilled.match(result)) dispatch(fetchProducts({ page, limit: 15, search }));
    else toast.error(result.payload || 'Xóa thất bại');
  };

  const columns = [
    {
      key: 'thumbnail_url', label: 'Sản phẩm',
      render: (url, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-coffee-400" />}
          </div>
          <div>
            <p className="font-medium text-coffee-900 text-sm">{row.name}</p>
            <p className="text-xs text-coffee-500">{row.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'category_name', label: 'Danh mục', render: (v) => v || '-' },
    { key: 'price', label: 'Giá', render: (v) => <span className="font-bold text-coffee-700">{formatCurrency(v)}</span> },
    { key: 'quantity_available', label: 'Tồn kho', render: (v) => <span className="font-semibold">{v ?? '-'}</span> },
    {
      key: 'is_active', label: 'Trạng thái',
      render: (v) => <span className={v ? 'badge-success' : 'badge-neutral'}>{v ? 'Đang bán' : 'Ngừng bán'}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-1">
          <Link to={`/products/${row.id}/edit`} className="p-1.5 hover:bg-coffee-50 text-coffee-400 hover:text-coffee-700 rounded-lg transition-colors"><Edit size={15} /></Link>
          <button type="button" onClick={() => handleDelete(row.id, row.name)} className="p-1.5 hover:bg-red-50 text-coffee-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Sản phẩm</h1>
          <p className="page-subtitle">{pagination.total} sản phẩm</p>
        </div>
        <Link to="/products/create" className="btn-primary"><Plus size={16} /> Thêm sản phẩm</Link>
      </div>
      <div className="card">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
          <input type="text" placeholder="Tìm kiếm sản phẩm..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="form-input pl-10" />
        </div>
      </div>
      <DataTable columns={columns} data={items} loading={loading} pagination={pagination} onPageChange={setPage} emptyMessage="Không tìm thấy sản phẩm." />
    </div>
  );
}
