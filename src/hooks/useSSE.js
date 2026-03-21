import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { BASE_URL } from '../store/api';
import { selectIsAuthenticated } from '../store/authSlice';
import { notificationsApi } from '../api/notifications';

/**
 * useSSE - Hook to manage Server-Sent Events for real-time notifications.
 * It connects to the backend stream and triggers UI updates/toasts.
 */
export const useSSE = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Use absolute URL for EventSource
    // Note: EventSource doesn't support custom headers (like Authorization), 
    // so we rely on cookies (credentials: 'include' is default for most browsers 
    // if using withCredentials: true).
    const sseUrl = `${BASE_URL}/notifications/stream`;
    console.log('[SSE] Connecting to:', sseUrl);

    const eventSource = new EventSource(sseUrl, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log('[SSE] Connection established');
    };

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('[SSE] New notification received:', notification);

        // 1. Show Toast
        toast.info(notification.content || notification.title, {
          title: notification.title,
          onClick: () => {
            if (notification.link) {
              window.location.href = notification.link;
            }
          }
        });

        // 2. Invalidate RTK Query cache to refresh notification count/list
        dispatch(notificationsApi.util.invalidateTags(['Notifications']));
      } catch (error) {
        console.error('[SSE] Error parsing notification data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      // EventSource automatically retries by default
    };

    return () => {
      console.log('[SSE] Closing connection');
      eventSource.close();
    };
  }, [isAuthenticated, dispatch]);
};
