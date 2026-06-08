import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="card text-center py-16">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-500 text-sm mt-2">Tính năng này có sẵn qua API. Giao diện đang được phát triển.</p>
    </div>
  );
}
