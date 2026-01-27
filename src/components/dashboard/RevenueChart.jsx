import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T1', revenue: 4000 },
  { name: 'T2', revenue: 3000 },
  { name: 'T3', revenue: 2000 },
  { name: 'T4', revenue: 2780 },
  { name: 'T5', revenue: 1890 },
  { name: 'T6', revenue: 2390 },
  { name: 'T7', revenue: 3490 },
];

export const RevenueChart = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh Thu Theo Tháng</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
