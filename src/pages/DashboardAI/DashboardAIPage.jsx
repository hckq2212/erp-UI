import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Bot,
  ChevronDown,
  CircleDollarSign,
  FolderKanban,
  Image as ImageIcon,
  MessageSquareText,
  RefreshCw,
  UserRound,
  Video,
} from 'lucide-react';
import { useGetMeQuery } from '../../api/auth';
import { useGetAiDashboardQuery } from '../../api/aiDashboard';
import { USER_ROLE } from '../../utils/enums';

const MEMBER_VIEW_ROLES = ['BOD', 'ADMIN', 'PM', 'ADMIN_SALE'];
const currentDate = new Date();

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const formatCost = (value) => `${formatNumber(Math.round(Number(value || 0)))} VND`;

const SelectField = ({ icon: Icon, label, value, onChange, children, disabled }) => (
  <label className="flex min-w-0 flex-col gap-1.5">
    <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</span>
    <span className="relative flex items-center">
      <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
    </span>
  </label>
);

const StatCard = ({ label, value, icon: Icon, color, loading }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            {loading ? <span className="inline-block h-7 w-24 animate-pulse rounded-lg bg-slate-100" /> : value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

const ChartTooltip = ({ active, payload, label, spending }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-bold text-slate-500">Ngày {label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex min-w-40 items-center justify-between gap-5 text-xs">
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-black text-slate-800">{spending ? formatCost(item.value) : formatNumber(item.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardAIPage = () => {
  const { data: me } = useGetMeQuery();
  const canViewMembers = MEMBER_VIEW_ROLES.includes(me?.role);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    if (me?.id && !selectedUserId) setSelectedUserId(me.id);
  }, [me?.id, selectedUserId]);

  const queryArgs = {
    userId: selectedUserId,
    projectId: selectedProjectId,
    month: selectedMonth,
    year: selectedYear,
  };
  const { data, isLoading, isFetching, error, refetch } = useGetAiDashboardQuery(queryArgs, {
    skip: !me?.id || !selectedUserId,
  });

  const stats = data?.stats || { totalPrompts: 0, totalImages: 0, totalVideos: 0, totalCost: 0 };
  const members = data?.filters?.availableMembers || [];
  const projects = data?.filters?.availableProjects || [];
  const generations = data?.generations || [];
  const spending = data?.spending || [];
  const years = useMemo(() => {
    const start = Math.min(2025, currentDate.getFullYear());
    return Array.from({ length: currentDate.getFullYear() - start + 2 }, (_, index) => start + index);
  }, []);
  const errorMessage = error?.data?.message || 'Không thể tải dữ liệu thống kê AI.';
  const selectedMember = selectedUserId === 'ALL'
    ? 'toàn bộ thành viên'
    : members.find((member) => member.id === selectedUserId)?.fullName || me?.fullName || 'bạn';

  const handleMemberChange = (event) => {
    setSelectedProjectId('');
    setSelectedUserId(event.target.value);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-indigo-600">
            <Bot className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">AI Analytics</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Phân tích dữ liệu AI</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi lượt tạo và chi phí AI của {selectedMember}.
          </p>
        </div>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
            <RefreshCw className="h-4 w-4 animate-spin" /> Đang cập nhật
          </div>
        )}
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2 xl:grid-cols-4">
        {canViewMembers && (
          <SelectField icon={UserRound} label="Thành viên" value={selectedUserId} onChange={handleMemberChange}>
            <option value="ALL">Tất cả thành viên</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName} · {USER_ROLE[member.role] || member.role}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField icon={FolderKanban} label="Dự án" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
          <option value="">Tất cả dự án</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </SelectField>
        <SelectField icon={FolderKanban} label="Tháng" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>Tháng {month}</option>
          ))}
        </SelectField>
        <SelectField icon={FolderKanban} label="Năm" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
          {years.map((year) => <option key={year} value={year}>Năm {year}</option>)}
        </SelectField>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="font-bold text-rose-700">{errorMessage}</p>
          <button type="button" onClick={refetch} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tổng prompt" value={formatNumber(stats.totalPrompts)} icon={MessageSquareText} color="indigo" loading={isLoading} />
            <StatCard label="Ảnh đã tạo" value={formatNumber(stats.totalImages)} icon={ImageIcon} color="cyan" loading={isLoading} />
            <StatCard label="Video đã tạo" value={formatNumber(stats.totalVideos)} icon={Video} color="violet" loading={isLoading} />
            <StatCard label="Tổng chi tiêu" value={formatCost(stats.totalCost)} icon={CircleDollarSign} color="amber" loading={isLoading} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900">Thống kê Generations</h2>
                <p className="text-xs text-slate-500">Số lượt hoàn thành theo ngày trong tháng</p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold">
                <span className="text-indigo-600">● Prompt</span>
                <span className="text-cyan-600">● Hình ảnh</span>
                <span className="text-violet-600">● Video</span>
              </div>
            </div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generations} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="prompt" name="Prompt" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="images" name="Hình ảnh" stroke="#0891b2" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="videos" name="Video" stroke="#7c3aed" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7">
              <h2 className="text-lg font-black text-slate-900">Thống kê tiền đã dùng</h2>
              <p className="text-xs text-slate-500">Chi phí của các lượt tạo thành công theo ngày</p>
            </div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spending} margin={{ top: 10, right: 10, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiSpendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => formatNumber(value)} width={75} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip spending />} />
                  <Area type="monotone" dataKey="total" name="Chi tiêu" stroke="#f59e0b" strokeWidth={3} fill="url(#aiSpendingGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardAIPage;
