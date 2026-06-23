import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { inventoryAPI } from '../../api/inventory.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryAPI.getOne(id).then((r) => setItem(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!item) return <div className="card">Không tìm thấy</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/admin/inventory" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
      </div>
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500">SKU</p><p className="font-medium">{item.sku}</p></div>
        <div><p className="text-gray-500">Danh mục</p><p className="font-medium">{item.category_name}</p></div>
        <div><p className="text-gray-500">Tồn kho</p><p className="font-bold text-lg">{item.quantity_in_stock}</p></div>
        <div><p className="text-gray-500">Khả dụng</p><p className="font-bold text-lg text-green-600">{item.quantity_available}</p></div>
        <div><p className="text-gray-500">Đã giữ</p><p>{item.quantity_reserved}</p></div>
        <div><p className="text-gray-500">Tối thiểu</p><p>{item.min_stock_level}</p></div>
      </div>
      {item.transactions?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Giao dịch gần đây</h3>
          <ul className="space-y-2 text-sm">
            {item.transactions.map((t) => (
              <li key={t.id} className="flex justify-between border-b border-gray-50 py-2">
                <span className="capitalize">{t.type}</span>
                <span>{t.quantity}</span>
                <span className="text-gray-400">{new Date(t.created_at).toLocaleString('vi-VN')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
