import { useState, useCallback } from 'react';

export const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);

  const goToPage = useCallback((newPage) => setPage(newPage), []);
  const goToFirst = useCallback(() => setPage(1), []);
  const reset = useCallback(() => setPage(1), []);

  return { page, limit, goToPage, goToFirst, reset };
};
