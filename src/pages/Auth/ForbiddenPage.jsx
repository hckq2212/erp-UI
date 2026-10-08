import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const ForbiddenPage = ({ currentRole }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 rounded-full">
            Mã lỗi: 403 Forbidden
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Truy cập bị từ chối
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Bạn không có quyền truy cập vào chức năng này với vai trò{' '}
            <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {currentRole || 'Hiện tại'}
            </span>
            . Vui lòng liên hệ Quản trị viên hệ thống nếu bạn cần được cấp quyền.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
