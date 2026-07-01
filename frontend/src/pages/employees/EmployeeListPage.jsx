import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search, Plus, Edit2, Eye, RefreshCw, Mail, Phone,
  Briefcase, User, Filter, ChevronLeft, ChevronRight,
  Loader2, AlertCircle
} from "../../utils/icons";
import { employeesAPI } from "../../api/employees.api";
import { toast } from "react-hot-toast";

const STATUS_MAP = {
  active: { label: "Đang làm", color: "bg-green-100 text-green-700" },
  on_leave: { label: "Nghỉ phép", color: "bg-yellow-100 text-yellow-700" },
  inactive: { label: "Nghỉ việc", color: "bg-red-100 text-red-700" },
  terminated: { label: "Đã sa thải", color: "bg-gray-100 text-gray-500" },
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Quản lý",
  cashier: "Thu ngân",
  barista: "Pha chế",
  viewer: "Xem",
};

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const r = await employeesAPI.getAll(params);
      const data = r.data?.data || r.data || {};
      setEmployees(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      setTotal(data.total || data.length || 0);
    } catch (err) {
      toast.error("Không tải được danh sách nhân viên");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const totalPages = Math.ceil(total / LIMIT);

  const getInitials = (name) =>
    (name || "N").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} nhân viên · Trang {page}/{totalPages || 1}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchEmployees}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <Link
            to="/admin/employees/new"
            className="flex items-center gap-1.5 bg-amber-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-900 transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm nhân viên
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên, email, mã NV..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] bg-gray-50 focus:bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Đang làm" },
            { key: "on_leave", label: "Nghỉ phép" },
            { key: "inactive", label: "Nghỉ việc" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-[12.5px] font-semibold border transition-all ${
                statusFilter === f.key
                  ? "bg-amber-800 text-white border-amber-800"
                  : "bg-white text-gray-500 border-gray-200 hover:border-amber-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 text-[14px] mb-1">Không có nhân viên</p>
          <p className="text-gray-400 text-[13px] mb-5">
            {search ? "Không tìm thấy nhân viên phù hợp" : "Chưa có nhân viên nào trong hệ thống"}
          </p>
          {!search && (
            <Link
              to="/admin/employees/new"
              className="inline-flex items-center gap-2 bg-amber-800 text-white font-bold px-6 py-2.5 rounded-xl text-[13.5px] hover:bg-amber-900 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm nhân viên đầu tiên
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="text-left px-5 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vai trò</th>
                  <th className="text-left px-5 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Phòng ban</th>
                  <th className="text-left px-5 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Trạng thái</th>
                  <th className="text-right px-5 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => {
                  const statusMeta = STATUS_MAP[emp.status] || STATUS_MAP.active;
                  const empId = emp.id || emp._id || emp.employee_id;
                  return (
                    <tr key={empId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 overflow-hidden">
                            {emp.avatar_url ? (
                              <img src={emp.avatar_url} alt={emp.full_name} className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            ) : null}
                            <span>{getInitials(emp.full_name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-[13.5px] truncate">{emp.full_name || "Chưa có tên"}</p>
                            <p className="text-[12px] text-gray-400 truncate">{emp.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-[13px] text-gray-700">{ROLE_LABELS[emp.role] || emp.role || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-[13px] text-gray-700">{emp.department || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusMeta.color}`}>{statusMeta.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/employees/${empId}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"><Eye className="w-4 h-4" /></Link>
                          <Link to={`/admin/employees/${empId}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" /></Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-amber-300 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${
                page === i + 1
                  ? "bg-amber-800 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-amber-300"
              }`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-amber-300 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
