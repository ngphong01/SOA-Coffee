import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../api/analytics.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package } from "../../utils/icons";

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const COLORS = ['#6F4E37', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#8B4513', '#A52A2A', '#BC8F5F', '#D2B48C'];

export default function SalesAnalyticsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    setLoading(true);
    analyticsAPI.getTopProducts({ limit: 10, period })
      .then((r) => setData(r.data.data || []))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Phân tích bán hàng</h1>
          <p className="page-subtitle">Sản phẩm bán chạy nhất</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
          {[{ label: '7 Ngày', value: '7days' }, { label: '30 Ngày', value: '30days' }, { label: '1 Năm', value: '1year' }].map((p) => (
            <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${period === p.value ? 'bg-amber-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-6">Top 10 Sản Phẩm Bán Chạy</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
            <Tooltip />
            <Bar dataKey="total_quantity_sold" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {['#', 'Sản phẩm', 'SL Đã bán', 'Doanh thu'].map((h) => (
                <th key={h} className="text-left pb-3 pr-4 text-xs uppercase text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="py-3 pr-4"><span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-800 text-white' : 'bg-gray-100'}`}>{i + 1}</span></td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 font-bold">{p.total_quantity_sold}</td>
                <td className="py-3 font-bold text-amber-800">{formatCurrency(p.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
