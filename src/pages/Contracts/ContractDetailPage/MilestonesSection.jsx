import { Clock, Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';

export const MilestonesSection = ({ contract, onAddMilestone, onEditMilestone, onDeleteMilestone, formatDate }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-600" />
        Mốc thanh toán
      </h2>
      <button
        onClick={onAddMilestone}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Thêm mốc
      </button>
    </div>

    {contract.milestones && contract.milestones.length > 0 ? (
      <div className="space-y-3">
        {contract.milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Hạn: {formatDate(milestone.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-green-600">
                      {Number(milestone.amount || 0).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEditMilestone(milestone)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteMilestone(milestone)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Chưa có mốc thanh toán nào</p>
        <p className="text-sm mt-1">Nhấn "Thêm mốc" để tạo mới</p>
      </div>
    )}
  </div>
);
