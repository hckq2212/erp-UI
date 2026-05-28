import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function ChatMessageItem({ 
    message, 
    isMe, 
    showSenderName = true, 
    showAvatar = true, 
    isConsecutive = false 
}) {
    const navigate = useNavigate();
    const [resolvingTag, setResolvingTag] = useState(false);

    const renderParsedContent = (content) => {
        if (!content) return "";

        const regex = /@\{([A-Za-z0-9-]+)\}/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const matchIndex = match.index;
            const taskCode = match[1];

            if (matchIndex > lastIndex) {
                parts.push(content.substring(lastIndex, matchIndex));
            }

            parts.push(
                <button
                    key={matchIndex}
                    type="button"
                    onClick={() => handleTagClick(taskCode)}
                    disabled={resolvingTag}
                    className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 font-mono font-bold text-xs rounded-full border transition-all cursor-pointer disabled:opacity-50 ${
                        isMe 
                            ? "bg-white/20 hover:bg-white/30 text-white border-white/30" 
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250"
                    }`}
                >
                    {taskCode}
                </button>
            );

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    const handleTagClick = async (taskCode) => {
        setResolvingTag(true);
        try {
            const response = await axios.get(`http://localhost:3000/api/tasks`, {
                params: { q: taskCode, limit: 1 },
                withCredentials: true
            });

            const tasks = response.data.data || [];
            if (tasks.length > 0 && tasks[0].code === taskCode) {
                navigate(`/tasks/${tasks[0].id}`);
            } else {
                navigate(`/tasks?q=${taskCode}`);
            }
        } catch (error) {
            console.error("Error resolving task tag navigation:", error);
            navigate(`/tasks?q=${taskCode}`);
        } finally {
            setResolvingTag(false);
        }
    };

    const formatTime = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return "";
        }
    };

    const senderName = message.sender?.fullName || message.sender?.username || "Thành viên";
    const initial = senderName[0]?.toUpperCase() || "T";

    if (isMe) {
        return (
            <div className={`flex items-center justify-end gap-2.5 max-w-[85%] self-end group ${isConsecutive ? "mt-0.5" : "mt-2.5"}`}>
                {/* Time shown on the left on hover - styled as sleek dark Messenger pill badge */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-neutral-200 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded-[6px] shadow-sm font-sans select-none flex-shrink-0">
                    {formatTime(message.createdAt)}
                </span>

                {/* Bubble */}
                <div 
                    className="px-4 py-2 bg-[#0084ff] text-white shadow-sm rounded-[18px] text-sm font-sans whitespace-pre-wrap leading-relaxed max-w-[85%]"
                >
                    {renderParsedContent(message.content)}
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1 border-t border-white/20 pt-2">
                            {message.attachments.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-white hover:underline flex items-center gap-1.5 font-mono font-bold"
                                >
                                    📎 {file.name || "Tệp đính kèm"}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-start gap-2 max-w-[85%] self-start group ${isConsecutive ? "mt-0.5" : "mt-2.5"}`}>
            {/* Sender Avatar or Placeholder Indent */}
            {showAvatar ? (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-600 select-none self-end mb-1">
                    {initial}
                </div>
            ) : (
                <div className="w-7 h-7 flex-shrink-0 select-none" />
            )}

            {/* Bubble & Name Column */}
            <div className="flex flex-col items-start flex-1 min-w-0">
                {showSenderName && (
                    <span className="text-[10px] font-semibold text-gray-400 mb-0.5 ml-1">
                        {senderName}
                    </span>
                )}

                {/* Row containing bubble and time */}
                <div className="flex items-center gap-2.5 w-full">
                    <div 
                        className="px-4 py-2 bg-[#f0f2f5] text-slate-800 shadow-sm rounded-[18px] text-sm font-sans whitespace-pre-wrap leading-relaxed max-w-[85%]"
                    >
                        {renderParsedContent(message.content)}

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 flex flex-col gap-1 border-t border-gray-200/60 pt-2">
                                {message.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 font-mono font-semibold"
                                    >
                                        📎 {file.name || "Tệp đính kèm"}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Time shown on the right on hover - styled as sleek dark Messenger pill badge */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-neutral-200 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded-[6px] shadow-sm font-sans select-none flex-shrink-0">
                        {formatTime(message.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}
