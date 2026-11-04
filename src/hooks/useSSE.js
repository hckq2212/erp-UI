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
      dispatch(api.util.invalidateTags(['Contracts', 'ContractAddendums', 'Projects', 'Tasks']));
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
            'opportunity_resubmitted': ['Opportunities'],
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
            'project_updated': ['Projects', 'Tasks', 'PauseHistory', 'Debts'],
            'project_deleted': ['Projects'],
            'customer_created': ['Customers'],
            'customer_updated': ['Customers', 'Opportunities'],
            'customer_deleted': ['Customers'],
            'user_created': ['Users'],
            'user_updated': ['Users', 'Teams', 'Projects', 'Tasks'],
            'user_deleted': ['Users', 'Teams', 'Projects', 'Tasks'],
            'team_created': ['Teams'],
            'team_updated': ['Teams', 'Projects', 'Tasks'],
            'team_deleted': ['Teams', 'Projects', 'Tasks'],
            'team_member_added': ['Teams', 'Projects', 'Tasks'],
            'team_member_updated': ['Teams', 'Projects', 'Tasks'],
            'team_member_removed': ['Teams', 'Projects', 'Tasks'],
            'acceptance_created': ['Acceptance', 'Services', 'Projects', 'Tasks', 'Contracts'],
            'acceptance_approved': ['Acceptance', 'Services', 'Projects', 'Tasks', 'Contracts'],
            'acceptance_rejected': ['Acceptance', 'Services', 'Projects', 'Tasks', 'Contracts'],
            'acceptance_processed': ['Acceptance', 'Services', 'Projects', 'Tasks', 'Contracts'],
            'contract_addendum_created': ['ContractAddendums', 'Contracts', 'Projects', 'Tasks'],
            'contract_addendum_updated': ['ContractAddendums', 'Contracts', 'Projects', 'Tasks'],
            'contract_addendum_signed': ['ContractAddendums', 'Contracts', 'Projects', 'Tasks'],
            'contract_addendum_rejected': ['ContractAddendums', 'Contracts', 'Projects', 'Tasks'],
            'contract_addendum_approved': ['ContractAddendums', 'Contracts', 'Projects', 'Tasks'],
            'task_review_updated': ['TaskReviews', 'Tasks'],
            'task_result_check_updated': ['TaskResultChecks'],
          };

          const baseTags = eventToTags[payload.event] || [];
          const tagsToInvalidate = [...baseTags];

          // Invalidate specific entity ID if available
          if (payload.data?.id) {
            if (payload.event?.startsWith('project_')) {
              tagsToInvalidate.push(
                { type: 'Projects', id: payload.data.id },
                { type: 'PauseHistory', id: payload.data.id }
              );
            } else if (payload.event?.startsWith('task_')) {
              tagsToInvalidate.push({ type: 'Tasks', id: payload.data.id });
            } else if (payload.event?.startsWith('contract_addendum_')) {
              tagsToInvalidate.push({ type: 'ContractAddendums', id: payload.data.id });
              if (payload.data?.contractId) {
                tagsToInvalidate.push({ type: 'Contracts', id: payload.data.contractId });
              }
              if (payload.data?.projectId) {
                tagsToInvalidate.push({ type: 'Projects', id: payload.data.projectId });
                tagsToInvalidate.push({ type: 'Tasks', id: 'LIST' });
                tagsToInvalidate.push({ type: 'PaymentRequests', id: 'LIST' });
              }
            } else if (payload.event?.startsWith('contract_')) {
              tagsToInvalidate.push({ type: 'Contracts', id: payload.data.id });
            } else if (payload.event?.startsWith('customer_')) {
              tagsToInvalidate.push({ type: 'Customers', id: payload.data.id });
            } else if (payload.event?.startsWith('user_')) {
              tagsToInvalidate.push({ type: 'Users', id: payload.data.id });
            } else if (payload.event?.startsWith('team_') && !payload.event?.startsWith('team_member_')) {
              tagsToInvalidate.push({ type: 'Teams', id: payload.data.id });
            } else if (payload.event?.startsWith('acceptance_')) {
              tagsToInvalidate.push({ type: 'Acceptance', id: payload.data.id });
            }
          }

          const teamId = payload.data?.teamId || payload.data?.team?.id;
          if (payload.event?.startsWith('team_member_') && teamId) {
            tagsToInvalidate.push({ type: 'Teams', id: teamId });
          }

          if (tagsToInvalidate.length > 0) {
            console.log('[SSE] Invalidating tags:', tagsToInvalidate);
            dispatch(api.util.invalidateTags(tagsToInvalidate));
          }
          return;
        }

        // Handle Standard Notifications (Persistent)
        console.log('[SSE] New notification received:', payload);

        const title = payload.title || 'Thông báo mới';
        const rawContent = (payload.content || '').split('\n')[0];
        const MAX_CONTENT_LENGTH = 100;
        const content = rawContent.length > MAX_CONTENT_LENGTH
          ? `${rawContent.slice(0, MAX_CONTENT_LENGTH)}...`
          : rawContent;
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
        if (payload.type === 'TASK_COMPLETED' || payload.type?.startsWith('OPPORTUNITY_')) {
          const opportunityTags = ['Opportunities'];
          if (payload.relatedEntityId && payload.relatedEntityType === 'Opportunities') {
            opportunityTags.push({ type: 'Opportunities', id: payload.relatedEntityId });
          }
          dispatch(api.util.invalidateTags(opportunityTags));
        }

        // Yêu cầu thanh toán: làm mới danh sách, tổng nợ và chính yêu cầu được nhắc tới
        // để bấm popup/thông báo là thấy đúng trạng thái mới nhất.
        if (payload.type?.startsWith('PAYMENT_REQUEST')) {
          const prTags = [
            { type: 'PaymentRequests', id: 'LIST' },
            { type: 'PaymentRequests', id: 'TOTAL_DEBT' },
          ];
          if (payload.relatedEntityId) prTags.push({ type: 'PaymentRequests', id: payload.relatedEntityId });
          dispatch(api.util.invalidateTags(prTags));
        }

        // Real-time invalidation for project lifecycle & pause/close notifications
        if (
          payload.type?.startsWith('PROJECT_') ||
          payload.type?.includes('PAUSE') ||
          payload.type?.includes('CLOSE')
        ) {
          const projectTags = ['Projects', 'Tasks', 'PauseHistory', 'Debts'];
          if (payload.relatedEntityId) {
            projectTags.push(
              { type: 'Projects', id: payload.relatedEntityId },
              { type: 'PauseHistory', id: payload.relatedEntityId }
            );
          }
          console.log('[SSE] Project notification -> invalidating tags:', projectTags);
          dispatch(api.util.invalidateTags(projectTags));
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
