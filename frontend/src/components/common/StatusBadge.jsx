import React from 'react';
import clsx from 'clsx';

const statusMap = {
  pending: 'badge-warning',
  processing: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  refunded: 'badge-neutral',
  partial_refund: 'badge-warning',
  active: 'badge-success',
  inactive: 'badge-neutral',
  failed: 'badge-danger',
};

export default function StatusBadge({ status }) {
  const cls = statusMap[status] || 'badge-neutral';
  return (
    <span className={clsx(cls, 'capitalize')}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
