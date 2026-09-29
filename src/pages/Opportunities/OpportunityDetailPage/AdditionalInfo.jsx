import { Building2 } from 'lucide-react';

export const AdditionalInfo = ({ opportunity, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900">Thông tin bổ sung</h2>
      </div>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Ngày tạo</span>
          <span className="font-medium text-gray-900">{formatDate(opportunity.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cập nhật lần cuối</span>
          <span className="font-medium text-gray-900">{formatDate(opportunity.updatedAt)}</span>
        </div>
        {opportunity.createdBy && (
          <div className="flex justify-between">
            <span className="text-gray-500">Người tạo</span>
            <span className="font-medium text-gray-900">{opportunity.createdBy.fullName}</span>
          </div>
        )}
        {opportunity.referralPartner && (
          <div className="flex justify-between">
            <span className="text-gray-500">Đối tác giới thiệu</span>
            <span className="font-medium text-gray-900">{opportunity.referralPartner.name}</span>
          </div>
        )}
        {opportunity.status === 'OPP_REJECTED' && opportunity.rejectionReason && (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-1 text-gray-500">Lý do không duyệt</p>
            <p className="whitespace-pre-wrap font-medium text-red-600">{opportunity.rejectionReason}</p>
          </div>
        )}
        {Array.isArray(opportunity.rejections) && opportunity.rejections.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-3 text-gray-500">Lịch sử không duyệt ({opportunity.rejections.length})</p>
            <div className="space-y-3">
              {opportunity.rejections.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                    <span>{item.rejectedBy?.fullName || 'Không rõ người duyệt'}</span>
                    <span>{formatDate(item.rejectedAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-gray-900">{item.reason}</p>
                  <p className={`mt-2 text-xs font-medium ${item.resubmittedAt ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.resubmittedAt ? `Đã gửi lại ngày ${formatDate(item.resubmittedAt)}` : 'Chưa gửi lại'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
