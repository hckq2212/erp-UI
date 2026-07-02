import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../api/auth';
import { api } from '../../store/api';
import { logout, selectSessionExpired } from '../../store/authSlice';
import { clearSessionMarker } from '../../utils/authSession';

export const SessionExpiredModal = () => {
  const isOpen = useSelector(selectSessionExpired);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutRequest] = useLogoutMutation();
  const [isLeaving, setIsLeaving] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await logoutRequest().unwrap();
    } catch {
      // The refresh endpoint may already have cleared the expired cookies.
    } finally {
      clearSessionMarker();
      dispatch(logout());
      dispatch(api.util.resetApiState());
      navigate('/login', { replace: true });
      setIsLeaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-description"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="session-expired-title" className="text-lg font-semibold text-slate-900">
              Phiên đăng nhập hết hạn
            </h2>
            <p id="session-expired-description" className="mt-2 text-sm leading-6 text-slate-600">
              Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            disabled={isLeaving}
            onClick={handleConfirm}
            className="inline-flex min-w-20 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLeaving ? 'Đang chuyển...' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};
