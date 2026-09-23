import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BASE_URL, api } from '../store/api';
import { selectIsAuthenticated } from '../store/authSlice';
import { notificationsApi } from '../api/notifications';

/**
 * useSSE - Hook to manage Server-Sent Events for real-time notifications.
 * It connects to the backend stream and triggers UI updates/toasts.
 */
export const useSSE = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Use absolute URL for EventSource
    // Note: EventSource doesn't support custom headers (like Authorization), 
    // so we rely on cookies (credentials: 'include' is default for most browsers 
    // if using withCredentials: true).
    const sseUrl = `${BASE_URL}/notifications/stream`;

    const eventSource = new EventSource(sseUrl, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log('[SSE] Connection established');
    };

    eventSource.onmessage = (event) => {
      // console.log('[SSE] Raw data received:', event.data);
      try {
        const payload = JSON.parse(event.data);

        // Handle Module Events (Transient UI updates)
        if (payload.__isModuleEvent) {
          console.log(`[SSE] Module Event: ${payload.event}`, payload.data);

          const eventToTags = {
            'opportunity_created': ['Opportunities'],
            'opportunity_updated': ['Opportunities'],
            'opportunity_approved': ['Opportunities'],
            'opportunity_rejected': ['Opportunities'],
            'opportunity_deleted': ['Opportunities'],
            'quotation_created': ['Quotations', 'Opportunities'],
            'quotation_updated': ['Quotations', 'Opportunities'],
            'quotation_approved': ['Quotations', 'Opportunities', 'Contracts'],
            'quotation_rejected': ['Quotations', 'Opportunities'],
            'task_created': ['Tasks', 'Projects'],
            'task_updated': ['Tasks', 'Projects'],
            'task_status_changed': ['Tasks', 'Projects', 'TaskReviews', 'Opportunities'],
            'task_deleted': ['Tasks', 'Projects'],
            'contract_created': ['Contracts', 'Opportunities'],
            'contract_updated': ['Contracts'],
            'contract_signed': ['Contracts', 'PaymentMilestones', 'Debts'],
            'contract_rejected': ['Contracts', 'Opportunities'],
            'contract_deleted': ['Contracts'],
            'project_created': ['Projects', 'Contracts'],
            'project_updated': ['Projects'],
            'project_deleted': ['Projects'],
            'task_review_updated': ['TaskReviews', 'Tasks'],
            'task_result_check_updated': ['TaskResultChecks'],
          };

          const tagsToInvalidate = eventToTags[payload.event] || [];
          if (tagsToInvalidate.length > 0) {
            console.log('[SSE] Invalidating tags:', tagsToInvalidate);
            dispatch(api.util.invalidateTags(tagsToInvalidate));
          }
          return;
        }

        // Handle Standard Notifications (Persistent)
        console.log('[SSE] New notification received:', payload);

        const title = payload.title || 'Thông báo mới';
        const content = payload.content || '';
        const message = content ? `${title}: ${content}` : title;

        toast.info(message, {
          onClick: () => {
            if (payload.link) {
              navigate(payload.link);
            }
          },
          autoClose: 5000,
        });

        // Invalidate RTK Query cache for notifications
        dispatch(notificationsApi.util.invalidateTags(['Notifications']));
        if (payload.type === 'TASK_COMPLETED') {
          dispatch(api.util.invalidateTags(['Opportunities']));
        }
      } catch (error) {
        console.error('[SSE] Error parsing event data:', error);
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
