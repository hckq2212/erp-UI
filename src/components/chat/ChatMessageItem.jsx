import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function ChatMessageItem({ message, isMe }) {
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
            const fullMatch = match[0];
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
                    className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-mono font-bold text-xs rounded-none border border-emerald-200 transition-all cursor-pointer disabled:opacity-50"
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

    return (
        <div className={`flex flex-col mb-4 max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
            {/* Sender Name */}
            {!isMe && (
                <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">
                    {senderName}
                </span>
            )}

            {/* Bubble */}
            <div 
                className={`px-4 py-2.5 shadow-sm border ${
                    isMe 
                        ? "bg-indigo-50 text-indigo-950 border-indigo-100" 
                        : "bg-gray-100 text-slate-800 border-gray-200"
                }`}
                style={{ borderRadius: "0px" }} // Net sharp geometry
            >
                <p className="text-sm font-sans whitespace-pre-wrap leading-relaxed">
                    {renderParsedContent(message.content)}
                </p>

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

            {/* Time */}
            <span className="text-[9px] font-mono text-slate-400 mt-1 mx-1">
                {formatTime(message.createdAt)}
            </span>
        </div>
    );
}
