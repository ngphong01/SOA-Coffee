import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WS_URL || '';

let socket = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Map());

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token || !SOCKET_URL) return;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  return { socket, connected, connect, disconnect };
}

/**
 * Hook to listen for order status updates in realtime
 */
export function useOrderTracking(orderId) {
  const [realtimeStatus, setRealtimeStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!orderId || !socket?.connected) return;

    const eventName = `order:${orderId}:status`;
    const handler = (data) => {
      setRealtimeStatus(data.status);
      setLastUpdate(new Date().toISOString());
    };

    socket.on(eventName, handler);

    // Also listen to general order updates
    socket.on('order:updated', (data) => {
      if (data.order_id === orderId || data.id === orderId) {
        setRealtimeStatus(data.status);
        setLastUpdate(new Date().toISOString());
      }
    });

    return () => {
      socket.off(eventName, handler);
      socket.off('order:updated');
    };
  }, [orderId]);

  return { realtimeStatus, lastUpdate };
}

/**
 * Hook for global notifications (bell icon)
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket?.connected) return;

    const handler = (data) => {
      const notif = {
        id: Date.now(),
        type: data.type || 'info',
        title: data.title || 'Thông báo',
        message: data.message || '',
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handler);

    return () => {
      socket.off('notification', handler);
    };
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAllRead, clearAll };
}

export default useSocket;
