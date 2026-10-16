export const buildTaskToken = (taskId, displayCode) => `#{${taskId}:${displayCode}}`;

export const buildUserToken = (userId, displayName) => `@{${userId}:${displayName}}`;

export const parseChatTokens = (content) => {
    if (!content || typeof content !== 'string') return [];

    // Regex match 3 patterns:
    // 1. New user token: @{userId:DisplayName}
    // 2. New task token: #{taskId:DisplayCode}
    // 3. Legacy task token: @{TaskCode}
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
            // New user token @{userId:DisplayName}
            parts.push({
                type: 'user',
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
        if (seg.type === "user") return `@${seg.display}`;
        if (seg.type === "task") return `#${seg.display}`;
        if (seg.type === "legacy-task") return `#${seg.code}`;
        return seg.content;
    }).join("");
};

export const formatMessagePreview = (message, options = {}) => {
    if (!message) return "Chưa có tin nhắn";

    const { isGroup = false, selfUserId = null, allUsers = [] } = options;
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
