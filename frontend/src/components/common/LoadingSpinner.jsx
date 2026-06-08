import React from 'react';
import { Coffee } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-coffee-100 flex items-center justify-center animate-pulse">
          <Coffee size={28} className="text-coffee-600" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-coffee-300 border-t-coffee-700 animate-spin" />
      </div>
      <p className="mt-4 text-sm text-coffee-400 font-medium">Đang tải...</p>
    </div>
  );
}
