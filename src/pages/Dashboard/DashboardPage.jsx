import { DollarSign, Briefcase, Rocket, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';

export const DashboardPage = () => {
    // Mock data - replace with API call later
    const stats = {
        totalRevenue: '2.4 Tỷ',
        openOpportunities: 12,
        activeProjects: 5,
        unpaidDebts: '150 Tr'
    };

    return (
        <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-6'>Dashboard</h1>
            
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                <StatCard 
                    title='Tổng Doanh Thu' 
                    value={stats.totalRevenue} 
                    icon={DollarSign} 
                    color='blue'
                    trend='up'
                    trendValue='12%'
                />
                <StatCard 
                    title='Cơ Hội Đang Mở' 
                    value={stats.openOpportunities} 
                    icon={Briefcase} 
                    color='green'
                    trend='up'
                    trendValue='5%'
                />
                <StatCard 
                    title='Dự Án Đang Chạy' 
                    value={stats.activeProjects} 
                    icon={Rocket} 
                    color='orange'
                />
                <StatCard 
                    title='Công Nợ Chưa Thu' 
                    value={stats.unpaidDebts} 
                    icon={AlertCircle} 
                    color='red'
                    trend='down'
                    trendValue='2%'
                />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                <RevenueChart />
                {/* Placeholder for second chart */}
                <div className='bg-white p-6 rounded-lg shadow'>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Tỷ Lệ Chuyển Đổi</h3>
                     <div className='flex items-center justify-center h-80 bg-gray-50 rounded'>
                        <p className='text-gray-500'>Pie Chart Component Needed</p>
                     </div>
                </div>
            </div>

            <div className='grid grid-cols-1 gap-6'>
                <div className='bg-white rounded-lg shadow overflow-hidden'>
                    <div className='px-6 py-4 border-b border-gray-200'>
                        <h3 className='text-lg font-semibold text-gray-900'>Cơ Hội Gần Đây</h3>
                    </div>
                    <div className='p-6'>
                        <p className='text-center text-gray-500 py-4'>Chưa có dữ liệu</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
