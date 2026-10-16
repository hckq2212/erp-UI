import React from "react";
import { useNavigate } from "react-router-dom";
import { parseChatTokens } from "../../utils/chatTokenHelper";

export function ChatMessageItem({
    message,
    isMe,
    showSenderName = true,
    showAvatar = true,
    isConsecutive = false
}) {
    const navigate = useNavigate();

    const handleLegacyTagClick = (taskCode) => {
        // Tái sử dụng điều hướng router trực tiếp đến trang Tasks có kèm bộ lọc q, không cần gọi API thủ công
        navigate(`/tasks?q=${encodeURIComponent(taskCode)}`);
    };

    const renderParsedContent = (content) => {
        if (!content) return "";

        const tokens = parseChatTokens(content);
        if (tokens.length === 0) return content;

        return tokens.map((token, index) => {
            if (token.type === "text") {
                return <span key={index}>{token.content}</span>;
            }

            if (token.type === "task") {
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => navigate(`/tasks/${token.id}`)}
                        title={`Xem chi tiết công việc #${token.display}`}
                        className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 font-mono font-bold text-xs rounded-md border transition-all cursor-pointer ${isMe
                            ? "bg-white/20 hover:bg-white/30 text-white border-white/40 shadow-xs"
                            : "bg-orange-100/80 hover:bg-orange-200/80 text-[#F38820] border-orange-200 shadow-2xs"
                            }`}
                    >
                        #{token.display}
                    </button>
                );
            }

            if (token.type === "legacy-task") {
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleLegacyTagClick(token.code)}
                        title={`Xem chi tiết công việc #${token.code}`}
                        className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 font-mono font-bold text-xs rounded-md border transition-all cursor-pointer ${isMe
                            ? "bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-xs"
                            : "bg-orange-100/80 hover:bg-orange-200/80 text-[#F38820] border-orange-200 shadow-2xs"
                            }`}
                    >
                        #{token.code}
                    </button>
                );
            }

            if (token.type === "user") {
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                                new CustomEvent("chat:open_user_profile", {
                                    detail: {
                                        userId: token.id,
                                        userName: token.display
                                    }
                                })
                            );
                        }}
                        title={`Xem thông tin ${token.display}`}
                        className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 font-sans font-semibold text-xs rounded-md border transition-all cursor-pointer ${isMe
                            ? "bg-white/20 hover:bg-white/30 text-white border-white/40 shadow-xs"
                            : "bg-sky-100/80 hover:bg-sky-200/80 text-sky-700 border-sky-200/70 shadow-2xs"
                            }`}
                    >
                        @{token.display}
                    </button>
                );
            }

            return null;
        });
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

    const hasAttachments = Boolean(message.attachments && message.attachments.length > 0);
    const rawContent = (message.content || "").trim();
    const isPlaceholderText = rawContent === "[Hình ảnh]" || rawContent === "[Tệp đính kèm]";
    const hasText = Boolean(rawContent && (!hasAttachments || !isPlaceholderText));

    if (isMe) {
        return (
            <div className={`flex items-center justify-end gap-2.5 max-w-[82%] self-end group ${isConsecutive ? "mt-0.5" : "mt-1"}`}>
                {/* Time shown on the left on hover - styled as sleek dark Messenger pill badge */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-neutral-200 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded-[6px] shadow-sm font-sans select-none flex-shrink-0">
                    {formatTime(message.createdAt)}
                </span>

                {/* Bubble */}
                <div
                    className={`rounded-[18px] text-[15px] font-sans leading-snug max-w-full ${
                        hasText
                            ? "px-3.5 py-2 bg-[#F38820] text-white shadow-sm whitespace-pre-wrap"
                            : "bg-transparent shadow-none p-0"
                    }`}
                >
                    {hasText && renderParsedContent(message.content)}

                    {/* Attachments */}
                    {hasAttachments && (
                        <div className={`flex flex-col gap-2 ${hasText ? "mt-2 border-t border-white/20 pt-2" : ""}`}>
                            {message.attachments.map((file, idx) => {
                                const isImg = file.type === "image" || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(file.url || "");
                                const isAudio = file.type === "audio" || /\.(webm|mp3|wav|ogg|m4a)($|\?)/i.test(file.url || "");

                                if (isImg) {
                                    return (
                                        <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block max-w-[280px] rounded-xl overflow-hidden shadow-xs hover:opacity-95 transition-opacity"
                                        >
                                            <img
                                                src={file.url}
                                                alt={file.name || "Hình ảnh"}
                                                className="w-full max-h-[220px] object-cover rounded-xl"
                                            />
                                        </a>
                                    );
                                }

                                if (isAudio) {
                                    return (
                                        <div key={idx} className="flex flex-col gap-1 py-1">
                                            <span className="text-[10px] text-white/90 font-medium">
                                                🎤 {file.name || "Tin nhắn thoại"}
                                            </span>
                                            <audio controls src={file.url} className="max-w-[240px] h-8 rounded-full" />
                                        </div>
                                    );
                                }

                                return (
                                    <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-white hover:underline flex items-center gap-1.5 font-mono font-bold"
                                    >
                                        📎 {file.name || "Tệp đính kèm"}
                                    </a>
                                );
                            })}
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
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        const senderId = message.senderId || message.sender?.id;
                        if (senderId) {
                            window.dispatchEvent(
                                new CustomEvent("chat:open_user_profile", {
                                    detail: {
                                        userId: senderId,
                                        userName: senderName
                                    }
                                })
                            );
                        }
                    }}
                    className="w-7 h-7 rounded-full bg-orange-100 text-[#F38820] border border-orange-200/60 overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xs select-none self-end mb-1 shadow-2xs cursor-pointer hover:ring-2 hover:ring-orange-200 transition-all active:scale-95"
                    title={`Xem thông tin ${senderName}`}
                >
                    {message.sender?.avatarUrl ? (
                        <img
                            src={message.sender.avatarUrl}
                            alt={senderName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    ) : (
                        <span className="font-black text-[#F38820]">{initial}</span>
                    )}
                </div>
            ) : (
                <div className="w-7 h-7 flex-shrink-0 select-none" />
            )}

            {/* Bubble & Name Column */}
            <div className="flex flex-col items-start flex-1 min-w-0">
                {showSenderName && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const senderId = message.senderId || message.sender?.id;
                            if (senderId) {
                                window.dispatchEvent(
                                    new CustomEvent("chat:open_user_profile", {
                                        detail: {
                                            userId: senderId,
                                            userName: senderName
                                        }
                                    })
                                );
                            }
                        }}
                        className="text-[10px] font-semibold text-gray-400 hover:text-[#F38820] transition-colors mb-0.5 ml-1 text-left cursor-pointer"
                        title={`Xem thông tin ${senderName}`}
                    >
                        {senderName}
                    </button>
                )}

                {/* Row containing bubble and time */}
                <div className="flex items-center gap-2.5 w-full">
                    <div
                        className={`rounded-[18px] text-[15px] font-sans leading-snug max-w-full ${
                            hasText
                                ? "px-3.5 py-2 bg-[#f0f2f5] text-slate-900 shadow-sm whitespace-pre-wrap"
                                : "bg-transparent shadow-none p-0"
                        }`}
                    >
                        {hasText && renderParsedContent(message.content)}

                        {/* Attachments */}
                        {hasAttachments && (
                            <div className={`flex flex-col gap-2 ${hasText ? "mt-2 border-t border-gray-200/60 pt-2" : ""}`}>
                                {message.attachments.map((file, idx) => {
                                    const isImg = file.type === "image" || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(file.url || "");
                                    const isAudio = file.type === "audio" || /\.(webm|mp3|wav|ogg|m4a)($|\?)/i.test(file.url || "");

                                    if (isImg) {
                                        return (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block max-w-[280px] rounded-xl overflow-hidden shadow-xs hover:opacity-95 transition-opacity"
                                            >
                                                <img
                                                    src={file.url}
                                                    alt={file.name || "Hình ảnh"}
                                                    className="w-full max-h-[220px] object-cover rounded-xl"
                                                />
                                            </a>
                                        );
                                    }

                                    if (isAudio) {
                                        return (
                                            <div key={idx} className="flex flex-col gap-1 py-1">
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    🎤 {file.name || "Tin nhắn thoại"}
                                                </span>
                                                <audio controls src={file.url} className="max-w-[240px] h-8 rounded-full" />
                                            </div>
                                        );
                                    }

                                    return (
                                        <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#F38820] hover:text-[#d97616] hover:underline flex items-center gap-1.5 font-mono font-semibold"
                                        >
                                            📎 {file.name || "Tệp đính kèm"}
                                        </a>
                                    );
                                })}
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
