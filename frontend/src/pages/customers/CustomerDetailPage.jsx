import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from "../../utils/icons";
import { customersAPI } from '../../api/customers.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersAPI.getOne(id).then((r) => setCustomer(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!customer) return <div className="card">Không tìm thấy khách hàng</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/admin/customers" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
      </div>
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500">Email</p><p>{customer.email || '-'}</p></div>
        <div><p className="text-gray-500">Điện thoại</p><p>{customer.phone || '-'}</p></div>
        <div><p className="text-gray-500">Phân khúc</p><p className="capitalize font-medium">{customer.segment}</p></div>
        <div><p className="text-gray-500">Điểm tích lũy</p><p className="font-bold">{customer.loyalty_points}</p></div>
        <div><p className="text-gray-500">Tổng đơn</p><p>{customer.total_orders}</p></div>
        <div><p className="text-coffee-500">Tổng chi</p><p className="font-bold text-coffee-700">{formatCurrency(customer.total_spent)}</p></div>
      </div>
      {customer.recent_orders?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
          <ul className="space-y-2">
            {customer.recent_orders.map((o) => (
              <li key={o.order_number} className="flex justify-between text-sm border-b py-2">
                <span className="font-medium text-amber-800">{o.order_number}</span>
                <span>{formatCurrency(o.total_amount)}</span>
                <span className="capitalize text-gray-500">{o.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
