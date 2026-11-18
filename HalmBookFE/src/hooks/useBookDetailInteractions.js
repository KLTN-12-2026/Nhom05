import { useEffect, useState, useRef } from 'react';
import { createBookDetailInteractions } from '@/features/books/detailInteractions';

export default function useBookDetailInteractions(book, bookId) {
  const instance = useRef(null);
  const [handlers] = useState(() => Object.fromEntries(["createStars","openRentalModal","closeRentalModal","selectRentalModalPlan","confirmRentalModalAddToCart","scrollAuthorBooks","toggleCartDrawer","handleCheckoutCart","switchTab","showToast"].map(name => [name, (...args) => instance.current?.[name](...args)])));
  useEffect(() => {
    if (!book) return;
    const current = createBookDetailInteractions({ book, bookId });
    instance.current = current;
    return () => { current.dispose(); if (instance.current === current) instance.current = null; };
  }, [book, bookId]);
  return handlers;
}
