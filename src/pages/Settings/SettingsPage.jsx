import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ClipboardCheck, Gauge } from 'lucide-react';
import { useGetMeQuery } from '../../api/auth';
import { QcSettingsTab } from './QcSettingsTab';
import { WorkloadNormSettingsTab } from './WorkloadNormSettingsTab';

const TABS = [
  { id: 'qc', label: 'Cấu hình QC', icon: ClipboardCheck, component: QcSettingsTab },
  { id: 'workload', label: 'Định mức workload', icon: Gauge, component: WorkloadNormSettingsTab },
];

export const SettingsPage = () => {
  const { data: me, isLoading } = useGetMeQuery();
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  if (isLoading) return null;
  if (me?.role !== 'ADMIN') return <Navigate to="/" replace />;

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-500 text-sm mt-1">Cấu hình hệ thống dành cho quản trị viên</p>
      </div>

      <div className="flex border-b border-gray-200 gap-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </div>
            {activeTab === id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
};
