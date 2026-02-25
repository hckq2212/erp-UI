import { Users, Phone, User } from 'lucide-react';

export const TeamInfo = ({ team }) => {
    if (!team) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Đội ngũ thực hiện</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tên đội</p>
                    <p className="text-sm font-semibold text-purple-700">{team.name}</p>
                </div>

                {team.teamLead && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Trưởng nhóm</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{team.teamLead.fullName}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    <span>{team.teamLead.phoneNumber}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
