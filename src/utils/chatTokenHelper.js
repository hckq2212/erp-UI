export const buildTaskToken = (taskId, displayCode) => `#{${taskId}:${displayCode}}`;

export const buildUserToken = (userId, displayName) => `@{${userId}:${displayName}}`;

export const buildAllToken = (displayName = "Tất cả mọi người") => `@{all:${displayName}}`;

export const parseChatTokens = (content) => {
    if (!content || typeof content !== 'string') return [];

    const tokenRegex = /(@\{([A-Za-z0-9_-]+):([^}]+)\})|(#{([A-Za-z0-9_-]+):([^}]+)})|(@\{([A-Za-z0-9_-]+)\})/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex, matchIndex)
            });
        }

        if (match[1]) {
            // New user token @{userId:DisplayName} hoặc @{all:Tất cả mọi người}
            const isAll = match[2] === "all";
            parts.push({
                type: isAll ? "all" : "user",
                id: match[2],
                display: match[3]
            });
        } else if (match[4]) {
            // New task token #{taskId:DisplayCode}
            parts.push({
                type: 'task',
                id: match[5],
                display: match[6]
            });
        } else if (match[7]) {
            // Legacy task token @{TaskCode}
            parts.push({
                type: 'legacy-task',
                code: match[8]
            });
        }

        lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.substring(lastIndex)
        });
    }

    return parts;
};

export const stripChatTokens = (content) => {
    if (!content || typeof content !== "string") return "";
    const segments = parseChatTokens(content);
    return segments.map(seg => {
        if (seg.type === "all") return `@${seg.display}`;
        if (seg.type === "user") return `@${seg.display}`;
        if (seg.type === "task") return `#${seg.display}`;
        if (seg.type === "legacy-task") return `#${seg.code}`;
        return seg.content;
    }).join("");
};

export const formatReplyPreview = (message) => {
    if (!message) return "...";
    if (message.isRecalled) return "[Tin nhắn đã được thu hồi]";
    const stripped = stripChatTokens(message.content).trim();
    if (stripped) return stripped;
    if (message.attachments && message.attachments.length > 0) {
        const first = message.attachments[0];
        const isImg =
            first.type === "image" ||
            first.type?.includes("image") ||
            /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(first.url || "");
        const isAudio =
            first.type === "audio" ||
            first.type?.includes("audio") ||
            /\.(webm|mp3|wav|ogg|m4a)($|\?)/i.test(first.url || "");
        if (isImg) return "[Hình ảnh]";
        if (isAudio) return "[Tin nhắn thoại]";
        return `[Tệp: ${first.name || first.originalName || "Tệp đính kèm"}]`;
    }
    return "...";
};

export const formatSystemMessage = (message, selfUserId) => {
    if (!message) return "";
    const meta = message.systemMetadata || {};
    const action = meta.action;
    const actorId = meta.actorId || message.senderId || message.sender?.id;
    const isActorMe = selfUserId && String(actorId) === String(selfUserId);
    const actorName = isActorMe ? "Bạn" : (meta.actorName || message.sender?.fullName || message.sender?.username || "Ai đó");

    switch (action) {
        case "CREATE_GROUP":
            return isActorMe ? "Bạn đã tạo nhóm chat." : `${actorName} đã tạo nhóm chat.`;

        case "ADD_MEMBER": {
            const targetIds = meta.targetIds || (meta.targetId ? [meta.targetId] : []);
            const targetNames = meta.targetNames || (meta.targetName ? [meta.targetName] : []);

            const formattedTargets = targetNames.map((name, idx) => {
                const tid = targetIds[idx];
                if (selfUserId && String(tid) === String(selfUserId)) {
                    return "bạn";
                }
                return name;
            });

            const targetsText = formattedTargets.length > 0 ? formattedTargets.join(", ") : "thành viên mới";
            return `${actorName} đã thêm ${targetsText} vào nhóm.`;
        }

        case "SET_ADMIN": {
            const isTargetMe = selfUserId && String(meta.targetId) === String(selfUserId);
            const targetName = isTargetMe ? "bạn" : (meta.targetName || "thành viên");
            return `${actorName} đã thêm ${targetName} làm quản trị viên nhóm.`;
        }

        case "REMOVE_ADMIN": {
            const isTargetMe = selfUserId && String(meta.targetId) === String(selfUserId);
            const targetName = isTargetMe ? "bạn" : (meta.targetName || "thành viên");
            return `${actorName} đã gỡ quyền quản trị viên của ${targetName}.`;
        }

        case "REMOVE_MEMBER": {
            const isTargetMe = selfUserId && String(meta.targetId) === String(selfUserId);
            const targetName = isTargetMe ? "bạn" : (meta.targetName || "thành viên");
            return `${actorName} đã xóa ${targetName} khỏi nhóm.`;
        }

        case "LEAVE_GROUP":
            return isActorMe ? "Bạn đã rời khỏi nhóm." : `${actorName} đã rời khỏi nhóm.`;

        case "RENAME_GROUP":
            return `${actorName} đã đổi tên nhóm thành "${meta.newName || ""}".`;

        case "CHANGE_AVATAR":
            return `${actorName} đã đổi ảnh đại diện nhóm.`;

        case "PIN_MESSAGE":
            return isActorMe ? "Bạn đã ghim một tin nhắn." : `${actorName} đã ghim một tin nhắn.`;

        case "UNPIN_MESSAGE":
            return isActorMe ? "Bạn đã bỏ ghim một tin nhắn." : `${actorName} đã bỏ ghim một tin nhắn.`;

        default:
            return message.content || "";
    }
};

export const formatMessagePreview = (message, options = {}) => {
    if (!message) return "Chưa có tin nhắn";

    const { isGroup = false, selfUserId = null, allUsers = [] } = options;

    if (message.isSystem) {
        return formatSystemMessage(message, selfUserId);
    }

    const content = message.content || "";
    let previewText = "";

    if (!content.trim() || content === "[Hình ảnh]" || content === "[Tệp đính kèm]") {
        const attachments = message.attachments;
        if (attachments && attachments.length > 0) {
            const first = attachments[0];
            const isImg = first.type === "image" || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(first.url || "");
            const isAudio = first.type === "audio" || /\.(webm|mp3|wav|ogg|m4a)($|\?)/i.test(first.url || "");
            if (isImg) previewText = "[Hình ảnh]";
            else if (isAudio) previewText = "[Tin nhắn thoại]";
            else previewText = `[Tệp: ${first.name || "Tệp đính kèm"}]`;
        } else {
            return "Chưa có tin nhắn";
        }
    } else {
        previewText = stripChatTokens(content);
    }

    const senderId = message.senderId || message.sender?.id;
    if (senderId) {
        const isMe = selfUserId && String(senderId) === String(selfUserId);
        if (isMe) {
            return `Bạn: ${previewText}`;
        }
        if (isGroup) {
            const senderUser = message.sender || allUsers.find(u => u.id === senderId);
            const senderName = senderUser?.fullName || senderUser?.username || "Thành viên";
            return `${senderName}: ${previewText}`;
        }
    }

    return previewText;
};

export const parseSafeChatDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
    let str = String(dateStr).trim();
    // Nếu chuỗi có định dạng ISO không có timezone indicator (Z hoặc offset +/-hh:mm), chuẩn hóa thêm 'Z' để Date hiểu là UTC
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(str) && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(str)) {
        str = str.replace(" ", "T") + "Z";
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

export const formatChatTime = (dateStr) => {
    try {
        const d = parseSafeChatDate(dateStr);
        if (!d) return "";
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
        return "";
    }
};
