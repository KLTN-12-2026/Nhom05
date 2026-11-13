import { useCallback, useEffect, useRef, useState } from 'react';
import { checkBookIsFavorite, toggleFavoriteBook } from './favoriteService';

type FavoriteBook = Parameters<typeof toggleFavoriteBook>[0];

export function useBookFavorite(book: FavoriteBook, isLoggedIn: boolean) {
  const [state, setState] = useState({ id: book.id, liked: false, ready: false, saving: false, message: '' });
  const pending = useRef(false);
  const revision = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    active.current = true;
    const ticket = ++revision.current;
    const load = async () => {
      const liked = isLoggedIn ? await checkBookIsFavorite(book.id) : false;
      if (active.current && revision.current === ticket) {
        setState({ id: book.id, liked, ready: true, saving: false, message: '' });
      }
    };
    void load();
    return () => { active.current = false; };
  }, [book.id, isLoggedIn]);

  const toggle = useCallback(async () => {
    if (pending.current || !isLoggedIn || !book.id) return;
    pending.current = true;
    const ticket = ++revision.current;
    setState(previous => ({ ...previous, saving: true, message: '' }));
    try {
      const result = await toggleFavoriteBook(book);
      if (active.current && revision.current === ticket) {
        setState(previous => ({
          ...previous,
          id: book.id,
          liked: result.success ? result.isFavorite : previous.liked,
          ready: true,
          saving: false,
          message: result.message,
        }));
      }
    } catch {
      if (active.current && revision.current === ticket) {
        setState(previous => ({ ...previous, saving: false, message: 'Chưa lưu được sách yêu thích. Vui lòng thử lại.' }));
      }
    } finally { pending.current = false; }
  }, [book, isLoggedIn]);

  return {
    isLiked: isLoggedIn && state.id === book.id && state.liked,
    isBusy: isLoggedIn && (state.id !== book.id || !state.ready || state.saving),
    message: state.id === book.id ? state.message : '',
    toggle,
  };
}
