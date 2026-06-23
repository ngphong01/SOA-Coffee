import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLowStockAlerts } from '../../store/slices/inventorySlice';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function InventoryAlertsPage() {
  const dispatch = useDispatch();
  const { alerts, alertsLoading } = useSelector((s) => s.inventory);

  useEffect(() => {
    dispatch(fetchLowStockAlerts());
  }, [dispatch]);

  if (alertsLoading) return <LoadingSpinner />;

  const severityStyle = {
    critical: 'border-red-200 bg-red-50',
    high: 'border-orange-200 bg-orange-50',
    medium: 'border-yellow-200 bg-yellow-50',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/admin/inventory" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="page-title">Cảnh báo tồn kho thấp</h1>
          <p className="page-subtitle">{alerts.length} mặt hàng cần chú ý</p>
        </div>
      </div>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">Tất cả tồn kho đều ở mức an toàn.</div>
        ) : (
          alerts.map((item) => (
            <div key={item.id} className={`card flex items-center gap-4 border ${severityStyle[item.severity] || 'border-gray-200'}`}>
              <AlertTriangle size={24} className={item.severity === 'critical' ? 'text-red-500' : 'text-orange-500'} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.sku} · {item.category_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Hiện có / Tối thiểu</p>
                <p className="font-bold text-red-600">{item.quantity_available} / {item.min_stock_level}</p>
              </div>
              <Link to={`/inventory/${item.id}`} className="btn-secondary text-sm">Xem</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
