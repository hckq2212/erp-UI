import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, Download, Smile, Pin, PinOff, Forward, RotateCcw, Pencil, Reply, MoreVertical } from "lucide-react";
import { parseChatTokens, formatReplyPreview, formatChatTime, formatSystemMessage } from "../../utils/chatTokenHelper";
import { DocumentPreviewModal } from "../common/DocumentPreviewModal";
import { downloadFile } from "../../utils/fileDetector";
import { useChatStore } from "../../store/useChatStore";
import { MessageReactionsModal } from "./MessageReactionsModal";
import { ForwardMessageModal } from "./ForwardMessageModal";

const REACTION_OPTIONS = [
    { emoji: "👍", label: "Thích" },
    { emoji: "❤️", label: "Yêu thích" },
    { emoji: "😂", label: "Haha" },
    { emoji: "😮", label: "Wow" },
    { emoji: "😢", label: "Buồn" },
    { emoji: "😡", label: "Phẫn nộ" }
];

function ReactionPickerBar({ myReaction, onSelect, align = "right" }) {
    return (
        <div
            className={`absolute z-30 -top-10 ${
                align === "right" ? "right-0" : "left-0"
            } bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-full shadow-lg border border-gray-200 flex items-center gap-0.5 select-none animate-in fade-in zoom-in-95 duration-150`}
            onClick={(e) => e.stopPropagation()}
        >
            {REACTION_OPTIONS.map((opt) => {
                const isSelected = myReaction === opt.emoji;
                return (
                    <button
                        key={opt.emoji}
                        type="button"
                        onClick={() => onSelect(opt.emoji)}
                        title={opt.label}
                        className={`text-lg hover:scale-135 active:scale-95 transition-all duration-150 p-1 rounded-full cursor-pointer flex items-center justify-center ${
                            isSelected ? "bg-orange-100 ring-2 ring-[#F38820]/50 scale-110" : "hover:bg-gray-100"
                        }`}
                    >
                        <span>{opt.emoji}</span>
                    </button>
                );
            })}
        </div>
    );
}

function MessageReactionsBadge({ reactions = [], selfUserId, isMe }) {
    const [showModal, setShowModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const grouped = useMemo(() => {
        if (!reactions || !Array.isArray(reactions) || reactions.length === 0) return [];
        const map = {};
        reactions.forEach((r) => {
            if (!r || !r.emoji) return;
            if (!map[r.emoji]) {
                map[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasMe: false };
            }
            const count = Number(r.count) || 1;
            map[r.emoji].count += count;
            const name = r.user?.fullName || r.user?.username || "Thành viên";
            map[r.emoji].users.push(name);
            if (String(r.userId) === String(selfUserId)) {
                map[r.emoji].hasMe = true;
            }
        });
        return Object.values(map).sort((a, b) => b.count - a.count);
    }, [reactions, selfUserId]);

    const { displayNames, remainingCount } = useMemo(() => {
        if (!reactions || !Array.isArray(reactions) || reactions.length === 0) {
            return { displayNames: [], remainingCount: 0 };
        }
        const userMap = new Map();
        reactions.forEach((r) => {
            if (!r || !r.userId) return;
            const uid = String(r.userId);
            if (!userMap.has(uid)) {
                const isSelf = String(selfUserId) === uid;
                const name = isSelf ? "Bạn" : (r.user?.fullName || r.user?.username || "Thành viên");
                userMap.set(uid, { isSelf, name });
            }
        });

        const list = Array.from(userMap.values());
        list.sort((a, b) => {
            if (a.isSelf) return -1;
            if (b.isSelf) return 1;
            return 0;
        });

        const total = list.length;
        if (total <= 4) {
            return { displayNames: list.map((item) => item.name), remainingCount: 0 };
        }
        return {
            displayNames: list.slice(0, 4).map((item) => item.name),
            remainingCount: total - 4
        };
    }, [reactions, selfUserId]);

    if (grouped.length === 0) return null;

    const totalCount = grouped.reduce((sum, g) => sum + g.count, 0);
    const hasMyReaction = grouped.some((g) => g.hasMe);

    return (
        <>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                    setShowModal(true);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`absolute -bottom-2.5 ${
                    isMe ? "right-2" : "left-2"
                } bg-white border ${
                    hasMyReaction ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"
                } rounded-full px-1.5 py-0.5 shadow-2xs flex items-center gap-1 cursor-pointer hover:bg-orange-50/60 hover:scale-105 transition-all z-20 select-none`}
            >
                <div className="flex items-center -space-x-0.5">
                    {grouped.slice(0, 3).map((g) => (
                        <span key={g.emoji} className="text-[12px] leading-none">{g.emoji}</span>
                    ))}
                </div>
                {totalCount > 1 && (
                    <span className={`text-[10px] font-bold ${hasMyReaction ? "text-[#F38820]" : "text-gray-600"}`}>
                        {totalCount}
                    </span>
                )}

                {/* Popover Tooltip khi hover (Đồng bộ chuẩn ERP Getvini Light) */}
                {isHovered && !showModal && displayNames.length > 0 && (
                    <div
                        className={`absolute top-full mt-2.5 ${
                            isMe ? "right-0" : "left-0"
                        } z-40 bg-white/95 backdrop-blur-md text-slate-800 rounded-xl px-3.5 py-2.5 shadow-xl border border-gray-200/90 text-[13px] leading-snug whitespace-nowrap min-w-[140px] select-none pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
                    >
                        {/* Mũi tên hướng lên trên chỉ vào badge biểu cảm */}
                        <div
                            className={`absolute -top-1.5 ${
                                isMe ? "right-4" : "left-4"
                            } w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-200`}
                        />
                        <div
                            className={`absolute -top-1 ${
                                isMe ? "right-4" : "left-4"
                            } w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white`}
                        />

                        <div className="flex flex-col text-left gap-1">
                            {displayNames.map((name, i) => (
                                <div
                                    key={i}
                                    className={
                                        name === "Bạn"
                                            ? "font-bold text-[#F38820]"
                                            : "font-medium text-slate-800"
                                    }
                                >
                                    {name}
                                </div>
                            ))}
                            {remainingCount > 0 && (
                                <div className="text-slate-400 text-xs font-normal pt-1 border-t border-gray-100 mt-0.5">
                                    và {remainingCount} người khác
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal chi tiết Biểu cảm khi click (Ảnh 2) */}
            {showModal && (
                <MessageReactionsModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    reactions={reactions}
                    selfUserId={selfUserId}
                />
            )}
        </>
    );
}

function ChatFileAttachmentCard({ file, createdAt, isMe }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const fileName = file.name || "Tệp đính kèm";
    const fileUrl = file.url || "#";

    const ext = useMemo(() => {
        const raw = fileName || fileUrl.split("?")[0];
        const match = raw.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1].toLowerCase() : "";
    }, [fileName, fileUrl]);

    const badgeConfig = useMemo(() => {
        switch (ext) {
            case "pdf":
                return { label: "PDF", bg: "#EF4444" };
            case "doc":
            case "docx":
                return { label: "DOC", bg: "#2563EB" };
            case "xls":
            case "xlsx":
                return { label: "XLS", bg: "#10B981" };
            case "csv":
                return { label: "CSV", bg: "#10B981" };
            case "ppt":
            case "pptx":
                return { label: "PPT", bg: "#F59E0B" };
            case "zip":
            case "rar":
            case "7z":
            case "tar":
            case "gz":
                return { label: "ZIP", bg: "#8B5CF6" };
            case "txt":
            case "log":
            case "md":
                return { label: "TXT", bg: "#64748B" };
            default:
                return { label: ext ? ext.slice(0, 4).toUpperCase() : "FILE", bg: "#64748B" };
        }
    }, [ext]);

    const formattedSize = useMemo(() => {
        const bytes = file.size;
        if (!bytes || isNaN(bytes)) return null;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, [file.size]);

    const formattedTime = useMemo(() => {
        return formatChatTime(createdAt);
    }, [createdAt]);

    const handleDownload = async (e) => {
        e.stopPropagation();
        await downloadFile(fileUrl, fileName);
    };

    return (
        <>
            <div
                className={`w-full max-w-[340px] sm:max-w-[380px] rounded-2xl p-3 transition-colors select-none text-left ${
                    isMe
                        ? "bg-[#fff6ed] hover:bg-[#ffeed9]"
                        : "bg-[#f0f2f5] hover:bg-[#e4e6eb]"
                }`}
            >
                {/* Top Row: Folded Badge + Info + Action Buttons */}
                <div className="flex items-center gap-2.5">
                    {/* File Icon Badge with Folded Corner */}
                    <div
                        onClick={() => setPreviewOpen(true)}
                        className="relative shrink-0 w-11 h-12 flex items-center justify-center cursor-pointer"
                        title={`Xem trước: ${fileName}`}
                    >
                        <svg className="w-11 h-12 drop-shadow-xs" viewBox="0 0 44 48" fill="none">
                            <path
                                d="M4 4C4 1.79086 5.79086 0 8 0H28L44 14V44C44 46.2091 42.2091 48 40 48H8C5.79086 48 4 46.2091 4 44V4Z"
                                fill={badgeConfig.bg}
                            />
                            <path
                                d="M28 0V11C28 12.6569 29.3431 14 31 14H44L28 0Z"
                                fill="white"
                                fillOpacity="0.45"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center pt-2 font-black text-white text-[11px] tracking-wider uppercase">
                            {badgeConfig.label}
                        </span>
                    </div>

                    {/* Middle File Info */}
                    <div className="flex-1 min-w-0 pr-1">
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                            className="font-semibold text-slate-800 hover:text-[#F38820] text-[13.5px] leading-snug truncate cursor-pointer block transition-colors text-left w-full"
                            title={`Xem trước: ${fileName}`}
                        >
                            {fileName}
                        </button>
                        {formattedSize && (
                            <div className="mt-1 text-slate-400 text-xs font-normal">
                                {formattedSize}
                            </div>
                        )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                            title="Xem trước tệp"
                            className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 text-gray-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <Folder className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            title="Tải xuống"
                            className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 text-gray-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Timestamp */}
                {formattedTime && (
                    <div className="mt-1 pt-0.5 text-[11px] text-gray-400 font-sans">
                        {formattedTime}
                    </div>
                )}
            </div>

            {/* Modal Xem trước tài liệu DocumentPreviewModal */}
            {previewOpen && (
                <DocumentPreviewModal
                    isOpen={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    fileUrl={fileUrl}
                    fileName={fileName}
                />
            )}
        </>
    );
}

export function ChatMessageItem({
    message,
    isMe,
    selfUserId,
    showSenderName = true,
    showAvatar = true,
    isConsecutive = false
}) {
    const navigate = useNavigate();
    const {
        reactToMessage,
        pinMessage,
        recallMessage,
        setEditingMessage,
        setReplyingToMessage,
        activeRoom
    } = useChatStore();
    const [showPicker, setShowPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const moreMenuRef = useRef(null);
    const pickerTimerRef = useRef(null);

    // Close more menu when clicking outside
    useEffect(() => {
        if (!showMoreMenu) return;
        const handleClickOutside = (e) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMoreMenu]);

    const myReaction = useMemo(() => {
        if (!message.reactions || !Array.isArray(message.reactions)) return null;
        return message.reactions.find(r => String(r.userId) === String(selfUserId))?.emoji || null;
    }, [message.reactions, selfUserId]);

    const hasReactions = Boolean(!message.isRecalled && message.reactions && message.reactions.length > 0);

    // Permission checks
    const isSender = Boolean(
        selfUserId &&
        (String(message.senderId) === String(selfUserId) || String(message.sender?.id) === String(selfUserId))
    );

    const isRoomAdmin = Boolean(
        activeRoom && (
            String(activeRoom.creatorId) === String(selfUserId) ||
            activeRoom.participants?.some(p => String(p.userId) === String(selfUserId) && (p.role === "ADMIN" || p.role === "DEPUTY"))
        )
    );

    // Edit permission: sender only, within 15 mins, not recalled
    const canEdit = useMemo(() => {
        if (message.isRecalled || !isSender || !message.createdAt) return false;
        const msgTime = new Date(message.createdAt).getTime();
        const diffMinutes = (Date.now() - msgTime) / (60 * 1000);
        return diffMinutes <= 15;
    }, [message.isRecalled, isSender, message.createdAt]);

    // Recall permission: Chỉ chính người gửi mới có thể thu hồi tin nhắn của mình
    const canRecall = useMemo(() => {
        if (message.isRecalled) return false;
        return isSender;
    }, [message.isRecalled, isSender]);

    if (message?.isSystem) {
        const text = formatSystemMessage(message, selfUserId);
        const isPinAction = message.systemMetadata?.action === "PIN_MESSAGE";
        const targetMessageId = message.systemMetadata?.pinnedMessageId;

        const handleJumpToMessage = () => {
            if (!targetMessageId) return;
            window.dispatchEvent(
                new CustomEvent("chat:jump_to_message", {
                    detail: { messageId: targetMessageId }
                })
            );
        };

        return (
            <div
                id={`chat-msg-${message.id}`}
                className="flex flex-col items-center justify-center my-2.5 px-4 w-full select-none"
            >
                <div
                    onClick={isPinAction && targetMessageId ? handleJumpToMessage : undefined}
                    className={`inline-flex items-center gap-1.5 text-[13px] text-slate-500 font-medium text-center max-w-[85%] leading-relaxed ${
                        isPinAction && targetMessageId ? "cursor-pointer hover:text-[#F38820] transition-colors" : ""
                    }`}
                >
                    {isPinAction && <Pin className="w-3.5 h-3.5 text-[#F38820] shrink-0" />}
                    <span>{text}</span>
                </div>
            </div>
        );
    }

    const handleLegacyTagClick = (taskCode) => {
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
                        className={`inline-flex items-center px-2 py-0.5 mx-0.5 font-mono font-bold text-[13px] rounded-full border transition-all cursor-pointer select-none align-baseline ${
                            isMe
                                ? "bg-white/15 hover:bg-white text-white hover:text-[#F38820] border-white/35 hover:border-white shadow-2xs"
                                : "bg-orange-100/90 hover:bg-orange-200 text-[#F38820] border-orange-200/80 shadow-2xs"
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
                        className={`inline-flex items-center px-2 py-0.5 mx-0.5 font-mono font-bold text-[13px] rounded-full border transition-all cursor-pointer select-none align-baseline ${
                            isMe
                                ? "bg-white/15 hover:bg-white text-white hover:text-[#F38820] border-white/35 hover:border-white shadow-2xs"
                                : "bg-orange-100/90 hover:bg-orange-200 text-[#F38820] border-orange-200/80 shadow-2xs"
                        }`}
                    >
                        #{token.code}
                    </button>
                );
            }

            if (token.type === "all") {
                let tagClass = "";
                if (isMe) {
                    tagClass = "bg-white/20 hover:bg-white text-white hover:text-[#F38820] border-white/40 shadow-2xs font-bold";
                } else {
                    tagClass = "bg-orange-100 hover:bg-orange-200 text-[#F38820] border-orange-300 ring-1 ring-orange-300/60 shadow-2xs font-bold";
                }

                return (
                    <span
                        key={index}
                        title="Thông báo cho tất cả thành viên trong nhóm"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 font-sans text-[13px] rounded-full border transition-all select-none align-baseline cursor-default ${tagClass}`}
                    >
                        <span>@{token.display || "Tất cả mọi người"}</span>
                    </span>
                );
            }

            if (token.type === "user") {
                const isMentionedSelf = Boolean(selfUserId && String(token.id) === String(selfUserId));

                let tagClass = "";
                if (isMe) {
                    tagClass = "bg-white/15 hover:bg-white text-white hover:text-[#F38820] border-white/35 hover:border-white shadow-2xs font-bold";
                } else if (isMentionedSelf) {
                    tagClass = "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 ring-1 ring-amber-300/60 shadow-2xs font-bold";
                } else {
                    tagClass = "bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 shadow-2xs font-semibold";
                }

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
                        className={`inline-flex items-center px-2 py-0.5 mx-0.5 font-sans text-[13px] rounded-full border transition-all cursor-pointer select-none align-baseline ${tagClass}`}
                    >
                        @{token.display}
                    </button>
                );
            }

            return null;
        });
    };

    const formatTime = (dateStr) => formatChatTime(dateStr);

    const senderName = message.sender?.fullName || message.sender?.username || "Thành viên";
    const initial = senderName[0]?.toUpperCase() || "T";

    const hasAttachments = Boolean(!message.isRecalled && message.attachments && message.attachments.length > 0);
    const rawContent = (message.content || "").trim();
    const isPlaceholderText = rawContent === "[Hình ảnh]" || rawContent === "[Tệp đính kèm]";
    const hasText = Boolean(rawContent && (!hasAttachments || !isPlaceholderText));
    const tokens = parseChatTokens(rawContent);
    const isSingleTagOnly = tokens.length === 1 && (tokens[0].type === "user" || tokens[0].type === "task" || tokens[0].type === "legacy-task");
    const hasFileAttachment = Boolean(
        message.attachments?.some(
            (f) => f.type === "file" || (!/\.(jpg|jpeg|png|webp|gif|webm|mp3|wav|ogg|m4a)($|\?)/i.test(f.url || ""))
        )
    );
    const showHoverTime = hasText || !hasFileAttachment;

    const handleReactionSelect = (emoji) => {
        setShowPicker(false);
        if (message?.id) {
            reactToMessage(message.id, emoji);
        }
    };

    const handleTogglePin = async (e) => {
        e.stopPropagation();
        setShowMoreMenu(false);
        if (!activeRoom?.id || !message?.id) return;
        await pinMessage(activeRoom.id, message.id, !message.isPinned);
    };

    const handleRecall = async (e) => {
        e.stopPropagation();
        setShowMoreMenu(false);
        if (!activeRoom?.id || !message?.id) return;
        if (window.confirm("Bạn có chắc chắn muốn thu hồi tin nhắn này không?")) {
            await recallMessage(activeRoom.id, message.id);
        }
    };

    const handleStartEdit = (e) => {
        e.stopPropagation();
        setShowMoreMenu(false);
        setEditingMessage(message);
    };

    const handleStartReply = (e) => {
        e.stopPropagation();
        setReplyingToMessage(message);
    };

    // Render floating action bar (Smile, Reply ở giữa, Dấu : ở cuối)
    const renderMessageActions = (align = "right") => {
        if (message.isRecalled) return null;

        const smileBtn = (
            <div key="smile" className="relative flex items-center">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPicker(!showPicker);
                        setShowMoreMenu(false);
                    }}
                    title="Bày tỏ cảm xúc"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        showPicker
                            ? "bg-gray-100 text-[#F38820]"
                            : "text-gray-400 hover:text-[#F38820] hover:bg-gray-100"
                    }`}
                >
                    <Smile className="w-4 h-4" />
                </button>

                {showPicker && (
                    <ReactionPickerBar
                        myReaction={myReaction}
                        onSelect={handleReactionSelect}
                        align={align}
                    />
                )}
            </div>
        );

        const replyBtn = (
            <button
                key="reply"
                type="button"
                onClick={handleStartReply}
                title="Trả lời tin nhắn"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer text-gray-400 hover:text-[#F38820] hover:bg-gray-100"
            >
                <Reply className="w-4 h-4" />
            </button>
        );

        const moreBtn = (
            <div key="more" className="relative flex items-center" ref={moreMenuRef}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreMenu(!showMoreMenu);
                        setShowPicker(false);
                    }}
                    title="Tùy chọn khác"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        showMoreMenu
                            ? "bg-gray-100 text-[#F38820]"
                            : "text-gray-400 hover:text-[#F38820] hover:bg-gray-100"
                    }`}
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {showMoreMenu && (
                    <div
                        className={`absolute z-40 -top-2 ${
                            align === "right" ? "right-full mr-1.5" : "left-full ml-1.5"
                        } bg-white text-slate-800 rounded-xl shadow-xl border border-gray-100 py-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-150 select-none`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Ghim / Bỏ ghim */}
                        <button
                            type="button"
                            onClick={handleTogglePin}
                            className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-orange-50 hover:text-[#F38820] flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <Pin className={`w-3.5 h-3.5 ${message.isPinned ? "text-[#F38820] fill-current" : ""}`} />
                            <span>{message.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}</span>
                        </button>

                        {/* Chuyển tiếp */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMoreMenu(false);
                                setShowForwardModal(true);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-orange-50 hover:text-[#F38820] flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <Forward className="w-3.5 h-3.5" />
                            <span>Chuyển tiếp</span>
                        </button>

                        {/* Chỉnh sửa (trong vòng 15 phút) */}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={handleStartEdit}
                                className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-orange-50 hover:text-[#F38820] flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Chỉnh sửa</span>
                            </button>
                        )}

                        {/* Thu hồi tin nhắn (chỉ người gửi) */}
                        {canRecall && (
                            <button
                                type="button"
                                onClick={handleRecall}
                                className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-100 mt-1 pt-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                                <span>Thu hồi</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        );

        return (
            <div
                className={`relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                    showPicker || showMoreMenu ? "opacity-100" : ""
                }`}
            >
                {align === "right" ? [moreBtn, replyBtn, smileBtn] : [smileBtn, replyBtn, moreBtn]}
            </div>
        );
    };

    if (isMe) {
        return (
            <div
                id={`chat-msg-${message.id}`}
                className={`relative flex items-center justify-end gap-1.5 max-w-[85%] self-end group transition-colors rounded-2xl p-1 -m-1 ${
                    isConsecutive ? "mt-0.5" : "mt-1"
                } ${hasReactions ? "mb-2.5" : ""}`}
                onMouseLeave={() => setShowPicker(false)}
            >
                {/* Time shown on the left on hover */}
                {showHoverTime && !message.isRecalled && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-neutral-200 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded-[6px] shadow-sm font-sans select-none flex-shrink-0">
                        {formatTime(message.createdAt)}
                    </span>
                )}

                {/* Floating Action Bar */}
                {renderMessageActions("right")}

                {/* Bubble Container & Reply Header */}
                <div className="flex flex-col items-end max-w-full">
                    {/* Header thông báo "Bạn đã chuyển tiếp một tin nhắn" */}
                    {message.isForwarded && !message.isRecalled && (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-gray-500 mb-1 mr-1 select-none">
                            <Forward className="w-3.5 h-3.5 text-gray-400" />
                            <span>Bạn đã chuyển tiếp một tin nhắn</span>
                        </div>
                    )}

                    {/* Header thông báo "Bạn đã trả lời [Tên]" */}
                    {message.replyTo && !message.isRecalled && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (message.replyToId) {
                                    window.dispatchEvent(
                                        new CustomEvent("chat:jump_to_message", {
                                            detail: { messageId: message.replyToId }
                                        })
                                    );
                                }
                            }}
                            className="flex items-center gap-1 text-[11.5px] text-gray-500 mb-1 mr-1 select-none cursor-pointer hover:underline"
                            title="Bấm để cuộn tới tin nhắn gốc"
                        >
                            <Reply className="w-3.5 h-3.5 text-gray-400 rotate-180" />
                            <span>
                                Bạn đã trả lời{" "}
                                <strong className="text-slate-700 font-semibold">
                                    {String(message.replyTo.senderId) === String(selfUserId)
                                        ? "chính mình"
                                        : (message.replyTo.sender?.fullName || message.replyTo.sender?.username || "thành viên")}
                                </strong>
                            </span>
                        </div>
                    )}

                    <div className="relative max-w-full flex flex-col items-end">
                        {/* Pinned Pill Indicator */}
                        {message.isPinned && !message.isRecalled && (
                            <div
                                title="Tin nhắn đã ghim"
                                className="absolute -top-2.5 right-2 z-20 bg-amber-500 text-white rounded-full p-0.5 shadow-xs border border-white flex items-center justify-center scale-90"
                            >
                                <Pin className="w-2.5 h-2.5 fill-current" />
                            </div>
                        )}

                        {message.isRecalled ? (
                            /* Recalled message bubble */
                            <div data-chat-bubble="true" className="rounded-[18px] text-[13.5px] font-sans px-3.5 py-2 bg-gray-100 text-gray-400 italic border border-gray-200/80 shadow-2xs select-none">
                                [Tin nhắn đã được thu hồi]
                            </div>
                        ) : (
                            <div className="flex flex-col items-end max-w-full">
                                {/* Trích dẫn tin nhắn gốc (Quoted Box xếp lớp phía trên giống ảnh mẫu Messenger) */}
                                {message.replyTo && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (message.replyToId) {
                                                window.dispatchEvent(
                                                    new CustomEvent("chat:jump_to_message", {
                                                        detail: { messageId: message.replyToId }
                                                    })
                                                );
                                            }
                                        }}
                                        className="relative z-0 bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-600 text-xs px-3.5 pt-2 pb-3.5 rounded-[18px] -mb-2.5 max-w-[90%] truncate cursor-pointer transition-all shadow-2xs border border-gray-200 select-none"
                                        title="Bấm để cuộn tới tin nhắn gốc"
                                    >
                                        <span className="truncate">
                                            {formatReplyPreview(message.replyTo)}
                                        </span>
                                    </div>
                                )}

                                <div
                                    data-chat-bubble="true"
                                    className={`relative z-10 rounded-[18px] text-[15px] font-sans leading-snug max-w-full ${
                                        hasText
                                            ? `${isSingleTagOnly ? "px-2.5 py-1.5" : "px-3.5 py-2"} bg-[#F38820] text-white shadow-sm whitespace-pre-wrap`
                                            : "bg-transparent shadow-none p-0"
                                    }`}
                                >
                                    {hasText && renderParsedContent(message.content)}

                                    {/* Edited Badge */}
                                    {message.isEdited && (
                                        <span
                                            title={`Đã chỉnh sửa lúc ${formatTime(message.editedAt || message.updatedAt)}`}
                                            className="ml-1.5 text-[11px] text-white/70 italic select-none inline-block font-sans"
                                        >
                                            (đã chỉnh sửa)
                                        </span>
                                    )}

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
                                                    <ChatFileAttachmentCard
                                                        key={idx}
                                                        file={file}
                                                        createdAt={message.createdAt}
                                                        isMe={true}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reactions Badge */}
                        {!message.isRecalled && (
                            <MessageReactionsBadge
                                reactions={message.reactions}
                                selfUserId={selfUserId}
                                isMe={true}
                            />
                        )}
                    </div>
                </div>

                {/* Forward Modal */}
                {showForwardModal && (
                    <ForwardMessageModal
                        isOpen={showForwardModal}
                        onClose={() => setShowForwardModal(false)}
                        message={message}
                        messageToForward={message}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            id={`chat-msg-${message.id}`}
            className={`flex items-start gap-2 max-w-[85%] self-start group transition-colors rounded-2xl p-1 -m-1 ${
                isConsecutive ? "mt-0.5" : "mt-2.5"
            } ${hasReactions ? "mb-2.5" : ""}`}
            onMouseLeave={() => setShowPicker(false)}
        >
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

                {/* Row containing bubble, reactions badge, actions bar, and time */}
                <div className="flex flex-col items-start max-w-full">
                    {/* Header thông báo "[Tên] đã chuyển tiếp một tin nhắn" */}
                    {message.isForwarded && !message.isRecalled && (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-gray-500 mb-1 ml-1 select-none">
                            <Forward className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                                <strong className="text-slate-700 font-semibold">{senderName}</strong> đã chuyển tiếp một tin nhắn
                            </span>
                        </div>
                    )}

                    {/* Header thông báo "[Tên] đã trả lời [Tên]" */}
                    {message.replyTo && !message.isRecalled && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (message.replyToId) {
                                    window.dispatchEvent(
                                        new CustomEvent("chat:jump_to_message", {
                                            detail: { messageId: message.replyToId }
                                        })
                                    );
                                }
                            }}
                            className="flex items-center gap-1 text-[11.5px] text-gray-500 mb-1 ml-1 select-none cursor-pointer hover:underline"
                            title="Cuộn đến tin nhắn gốc"
                        >
                            <Reply className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                                <strong className="text-slate-700 font-semibold">{senderName}</strong> đã trả lời{" "}
                                <strong className="text-slate-700 font-semibold">
                                    {String(message.replyTo.senderId) === String(selfUserId)
                                        ? "bạn"
                                        : (message.replyTo.sender?.fullName || message.replyTo.sender?.username || "thành viên")}
                                </strong>
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 w-full">
                        {/* Bubble Container with Reactions Badge */}
                        <div className="relative max-w-full flex flex-col items-start">
                            {/* Pinned Pill Indicator */}
                            {message.isPinned && !message.isRecalled && (
                                <div
                                    title="Tin nhắn đã ghim"
                                    className="absolute -top-2.5 left-2 z-20 bg-amber-500 text-white rounded-full p-0.5 shadow-xs border border-white flex items-center justify-center scale-90"
                                >
                                    <Pin className="w-2.5 h-2.5 fill-current" />
                                </div>
                            )}

                            {message.isRecalled ? (
                                /* Recalled message bubble */
                                <div data-chat-bubble="true" className="rounded-[18px] text-[13.5px] font-sans px-3.5 py-2 bg-gray-100 text-gray-400 italic border border-gray-200/80 shadow-2xs select-none">
                                    [Tin nhắn đã được thu hồi]
                                </div>
                            ) : (
                                <div className="flex flex-col items-start max-w-full">
                                    {/* Trích dẫn tin nhắn gốc (Quoted Box xếp lớp phía trên giống ảnh mẫu Messenger) */}
                                    {message.replyTo && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (message.replyToId) {
                                                    window.dispatchEvent(
                                                        new CustomEvent("chat:jump_to_message", {
                                                            detail: { messageId: message.replyToId }
                                                        })
                                                    );
                                                }
                                            }}
                                            className="relative z-0 bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-700 text-xs px-3.5 pt-2 pb-3.5 rounded-[18px] -mb-2.5 max-w-[90%] truncate cursor-pointer transition-all shadow-2xs border border-gray-300/60 select-none"
                                            title="Bấm để cuộn tới tin nhắn gốc"
                                        >
                                            <span className="truncate">
                                                {formatReplyPreview(message.replyTo)}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        data-chat-bubble="true"
                                        className={`relative z-10 rounded-[18px] text-[15px] font-sans leading-snug max-w-full ${
                                            hasText
                                                ? `${isSingleTagOnly ? "px-2.5 py-1.5" : "px-3.5 py-2"} bg-[#f0f2f5] text-slate-900 shadow-sm whitespace-pre-wrap`
                                                : "bg-transparent shadow-none p-0"
                                        }`}
                                    >
                                        {hasText && renderParsedContent(message.content)}

                                        {/* Edited Badge */}
                                        {message.isEdited && (
                                            <span
                                                title={`Đã chỉnh sửa lúc ${formatTime(message.editedAt || message.updatedAt)}`}
                                                className="ml-1.5 text-[11px] text-gray-500 italic select-none inline-block font-sans"
                                            >
                                                (đã chỉnh sửa)
                                            </span>
                                        )}

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
                                                        <ChatFileAttachmentCard
                                                            key={idx}
                                                            file={file}
                                                            createdAt={message.createdAt}
                                                            isMe={false}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reactions Badge */}
                            {!message.isRecalled && (
                                <MessageReactionsBadge
                                    reactions={message.reactions}
                                    selfUserId={selfUserId}
                                    isMe={false}
                                />
                            )}
                        </div>

                        {/* Floating Action Bar */}
                        {renderMessageActions("left")}

                        {/* Time shown on the right on hover */}
                        {showHoverTime && !message.isRecalled && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-neutral-200 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded-[6px] shadow-sm font-sans select-none flex-shrink-0">
                                {formatTime(message.createdAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Forward Modal */}
            {showForwardModal && (
                <ForwardMessageModal
                    isOpen={showForwardModal}
                    onClose={() => setShowForwardModal(false)}
                    message={message}
                    messageToForward={message}
                />
            )}
        </div>
    );
}
