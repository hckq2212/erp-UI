import React, { useState } from 'react';
import { ChevronDown, User, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../utils/enums';
import { isSameUser } from '../../utils/authUser';

export const MemberSelector = ({ members = [], selectedId, onSelect, currentUserId }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Filter out the current user (the lead viewing their team)
    const filteredMembers = members.filter(m => m.user && m.user.id && !isSameUser(m.user.id, currentUserId));

    // Find the selected member object from the user list
    const selectedMember = members.find(m => m.user && isSameUser(m.user.id, selectedId));

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group w-[100%]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase font-bold text-xs">
                        {selectedId ? (selectedMember?.user?.fullName?.charAt(0) || <User className="w-4 h-4" />) : <User className="w-4 h-4" />}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Đang xem</p>
                        <p className="text-sm font-bold text-gray-900 leading-none">
                            {selectedId ? (selectedMember?.user?.fullName || 'Thành viên') : 'Dashboard cá nhân'}
                        </p>
                    </div>
                </div>

                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-sm shadow-2xl shadow-gray-200/50 border border-gray-100 p-3 z-50 overflow-hidden"
                    >
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xs transition-all ${!selectedId ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selectedId ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-left">Quay lại Dashboard của tôi</span>
                                </div>
                                {!selectedId && <Check className="w-4 h-4" />}
                            </button>

                            <div className="h-px bg-gray-50 my-2 mx-2" />

                            <p className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Thành viên trong team</p>

                            <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                                {filteredMembers.length > 0 ? filteredMembers.map((member) => {
                                    const isSelected = isSameUser(selectedId, member.user.id);
                                    return (
                                        <button
                                            key={member.user.id}
                                            onClick={() => {
                                                onSelect(member.user.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 font-bold text-xs uppercase ${isSelected ? 'bg-white shadow-sm text-blue-600' : ''}`}>
                                                    {member.user.fullName?.charAt(0) || <User className="w-4 h-4" />}
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <p className="text-sm font-bold truncate max-w-[140px] leading-tight">{member.user.fullName}</p>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                                        {TEAM_MEMBER_ROLE_LABELS[member.role] || USER_ROLE[member.role] || member.role || 'Nhân sự'}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4" />}
                                        </button>
                                    );
                                }) : (
                                    <div className="px-3 py-4 text-center text-xs text-gray-400 italic font-medium">
                                        Không tìm thấy thành viên
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
