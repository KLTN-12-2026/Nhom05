import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getUnreadNotificationCount, subscribeNotifications } from './notificationService';

export function useUnreadNotificationCount(isLoggedIn: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    let version = 0;
    const refresh = async () => {
      const ticket = ++version;
      try {
        const value = isLoggedIn ? await getUnreadNotificationCount() : 0;
        if (active && ticket === version) setCount(value);
      } catch { /* Keep the previous badge if storage is temporarily unavailable. */ }
    };
    void refresh();
    const unsubscribe = subscribeNotifications(() => { void refresh(); });
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => { active = false; unsubscribe(); subscription.remove(); };
  }, [isLoggedIn]);
  return isLoggedIn ? count : 0;
}
