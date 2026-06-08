import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';

export default function DataTable({
  columns, data = [], loading, pagination, onPageChange, emptyMessage = 'Không có dữ liệu.',
}) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="card overflow-hidden p-0 animate-fade-in">
      <div className="overflow-x-auto -mx-0">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-coffee-100 bg-coffee-50/50">
              {columns.map((col) => (
                <th key={col.key} className="table-header first:pl-6 last:pr-6">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-coffee-400">
                  <Database size={40} className="mx-auto mb-3 text-coffee-200" />
                  <p className="text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} className="table-row group">
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell first:pl-6 last:pr-6">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-coffee-100 bg-coffee-50/30">
          <p className="text-xs font-medium text-coffee-500">
            Trang {pagination.page} / {pagination.totalPages} &middot; Tổng {pagination.total} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-2 rounded-lg text-coffee-600 hover:bg-coffee-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
              const pageNum = start + i;
              if (pageNum > pagination.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    pageNum === pagination.page
                      ? 'bg-coffee-700 text-white shadow-md'
                      : 'text-coffee-600 hover:bg-coffee-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-2 rounded-lg text-coffee-600 hover:bg-coffee-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
