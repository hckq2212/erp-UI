import { Target, Briefcase } from 'lucide-react';
import { PRIORITY_LABELS, PRIORITY_COLORS, FIELD_LABELS } from '../../../utils/enums';

export const OpportunityEvaluation = ({ opportunity }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-5 h-5 text-orange-600" />
        <h2 className="font-semibold text-gray-900">Đánh giá cơ hội</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-500 mb-2">Lĩnh vực</p>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <Briefcase className="w-4 h-4 text-gray-600" />
            <span className="font-medium">{FIELD_LABELS[opportunity.field] || opportunity.field}</span>
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Độ ưu tiên</p>
          <span className={`inline-flex px-3 py-1.5 rounded-lg font-medium border ${PRIORITY_COLORS[opportunity.priority]}`}>
            {PRIORITY_LABELS[opportunity.priority] || opportunity.priority}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Khả năng thành công</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  opportunity.successChance >= 70 ? 'bg-green-500'
                    : opportunity.successChance >= 40 ? 'bg-orange-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${opportunity.successChance}%` }}
              />
            </div>
            <span className={`text-lg font-bold ${
              opportunity.successChance >= 70 ? 'text-green-600'
                : opportunity.successChance >= 40 ? 'text-orange-500'
                  : 'text-red-500'
            }`}>
              {opportunity.successChance}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
