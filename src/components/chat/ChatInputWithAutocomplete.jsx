import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Image,
    Mic,
    PlusCircle,
    SendHorizontal,
    Smile,
    CheckSquare,
    User,
    FolderKanban,
    ChevronRight,
    ArrowLeft,
    X,
    Loader2,
    Paperclip
} from "lucide-react";
import { useGetUsersQuery } from "../../api/users";
import { useGetTasksQuery, useGetTasksByProjectQuery } from "../../api/tasks";
import { useGetProjectsQuery } from "../../api/projects";
import { buildTaskToken, buildUserToken } from "../../utils/chatTokenHelper";
import { uploadToCloudinary } from "../../utils/cloudinary";

// Danh mục Emoji phổ biến chuẩn Messenger
const EMOJI_CATEGORIES = [
    {
        name: "Phổ biến",
        emojis: ["👍", "❤️", "😂", "🥰", "🔥", "🎉", "👏", "😮", "😢", "😎", "🤔", "🚀", "💼", "✅", "❌", "💡", "💯", "🙏"]
    },
    {
        name: "Cảm xúc",
        emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😊", "😇", "🙂", "😉", "😍", "😘", "😋", "🤪", "🤩", "🥳", "😏", "🥺", "😭", "😤", "😡", "😱", "😴"]
    },
    {
        name: "Cử chỉ",
        emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "✋", "👋", "👏", "🙌", "🤝", "🙏", "💪"]
    },
    {
        name: "Biểu tượng & Công việc",
        emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "💔", "💯", "✨", "⭐", "🌟", "💥", "💼", "📁", "📋", "📌", "📎", "⏰", "⏳", "💻", "📱", "🎯", "🏆"]
    }
];

export function ChatInputWithAutocomplete({ onSendMessage, onTyping, room }) {
    const [hasContent, setHasContent] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [triggerType, setTriggerType] = useState(null); // 'TASK' | 'USER' | null
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);

    // Chế độ xem task: 'ALL' (Tất cả task) hoặc 'BY_PROJECT' (Chọn theo dự án)
    const [taskViewMode, setTaskViewMode] = useState("ALL");
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Đính kèm tệp & hình ảnh
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    // Emoji picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeEmojiTab, setActiveEmojiTab] = useState(0);

    // Ghi âm tin nhắn thoại (Voice message)
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);

    const editorRef = useRef(null);
    const suggestionsRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const savedRangeRef = useRef(null);
    const triggerNodeRef = useRef(null);
    const triggerOffsetRef = useRef(-1);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Debounce searchQuery cho truy vấn API
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 250);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Click outside handler để đóng các popup khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Đóng gợi ý thành viên / task
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                editorRef.current &&
                !editorRef.current.contains(e.target)
            ) {
                setShowSuggestions(false);
                setTriggerType(null);
                setSelectedProjectId(null);
                setTaskViewMode("ALL");
            }

            // Đóng popup emoji
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(e.target) &&
                !e.target.closest("[data-emoji-trigger]")
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup recording timer on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // 1. TÁI SỬ DỤNG CACHE TỪ RTK QUERY:
    // User cache
    const { data: allUsersRaw = [] } = useGetUsersQuery(undefined, {
        refetchOnMountOrArgChange: false
    });
    const allUsers = Array.isArray(allUsersRaw) ? allUsersRaw : (allUsersRaw?.data || []);

    // Projects cache
    const { data: projectsDataRaw, isFetching: loadingProjects } = useGetProjectsQuery(
        { limit: 100 },
        { skip: triggerType !== "TASK", refetchOnMountOrArgChange: false }
    );
    const allProjects = Array.isArray(projectsDataRaw?.data)
        ? projectsDataRaw.data
        : (Array.isArray(projectsDataRaw) ? projectsDataRaw : []);

    // Task cache theo phòng chat
    const roomProjectId = room?.projectId;
    const { data: roomTasksRaw = [] } = useGetTasksByProjectQuery(roomProjectId, {
        skip: !roomProjectId,
        refetchOnMountOrArgChange: false
    });
    const roomTasks = Array.isArray(roomTasksRaw) ? roomTasksRaw : (roomTasksRaw?.data || []);

    // Task cache cho dự án được chọn qua drill-down
    const activeProjectId = selectedProjectId || roomProjectId;
    const { data: drillDownTasksRaw = [], isFetching: loadingDrillDownTasks } = useGetTasksByProjectQuery(selectedProjectId, {
        skip: !selectedProjectId,
        refetchOnMountOrArgChange: false
    });
    const drillDownTasks = Array.isArray(drillDownTasksRaw) ? drillDownTasksRaw : (drillDownTasksRaw?.data || []);

    // Task query toàn hệ thống
    const isGeneralTaskSearch = triggerType === "TASK" && !activeProjectId && taskViewMode === "ALL" && showSuggestions;
    const { data: generalTasksRaw, isFetching: loadingGeneralTasks } = useGetTasksQuery(
        { q: debouncedQuery, limit: 15 },
        { skip: !isGeneralTaskSearch }
    );
    const generalTasks = generalTasksRaw?.data || [];

    // Tìm thông tin dự án đang chọn
    const selectedProject = useMemo(() => {
        if (!selectedProjectId) return null;
        return allProjects.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, allProjects]);

    // 2. LỌC NỘI BỘ (IN-MEMORY FILTERING) TRÊN DỮ LIỆU ĐÃ CÓ TRONG RTK QUERY
    const suggestions = useMemo(() => {
        if (!showSuggestions || !triggerType) return [];
        const qLower = searchQuery.toLowerCase().trim();

        if (triggerType === "TASK") {
            // A. Nếu đang chọn 1 dự án cụ thể -> Task của dự án đó
            if (selectedProjectId) {
                if (!qLower) return drillDownTasks.slice(0, 20);
                return drillDownTasks.filter(task =>
                    (task.code && task.code.toLowerCase().includes(qLower)) ||
                    (task.name && task.name.toLowerCase().includes(qLower)) ||
                    (task.nickname && task.nickname.toLowerCase().includes(qLower))
                ).slice(0, 20);
            }

            // B. Nếu ở chế độ 'BY_PROJECT' và chưa chọn dự án -> Danh sách DỰ ÁN
            if (taskViewMode === "BY_PROJECT") {
                const filtered = allProjects.filter(p =>
                    !qLower ||
                    (p.name && p.name.toLowerCase().includes(qLower)) ||
                    (p.code && p.code.toLowerCase().includes(qLower)) ||
                    (p.customer?.name && p.customer.name.toLowerCase().includes(qLower))
                ).slice(0, 20);

                return filtered.map(p => ({
                    isProjectItem: true,
                    id: p.id,
                    project: p
                }));
            }

            // C. Chế độ 'ALL': Tìm kiếm task trực tiếp trên toàn hệ thống
            if (roomProjectId && roomTasks.length > 0) {
                if (!qLower) return roomTasks.slice(0, 15);
                return roomTasks.filter(task =>
                    (task.code && task.code.toLowerCase().includes(qLower)) ||
                    (task.name && task.name.toLowerCase().includes(qLower)) ||
                    (task.nickname && task.nickname.toLowerCase().includes(qLower))
                ).slice(0, 15);
            }

            return generalTasks;
        }

        if (triggerType === "USER") {
            // Tag tên thành viên (@) CHỈ có trong nhóm trò chuyện
            if (!room?.isGroup) return [];

            const roomParticipants = (room?.participants || [])
                .map(p => p.user || p)
                .filter(Boolean);

            const userMap = new Map();

            // CHỈ lấy các thành viên thuộc nhóm trò chuyện hiện tại
            roomParticipants.forEach(u => {
                if (!u?.id) return;
                const matches = !qLower ||
                    (u.fullName && u.fullName.toLowerCase().includes(qLower)) ||
                    (u.username && u.username.toLowerCase().includes(qLower)) ||
                    (u.nickname && u.nickname.toLowerCase().includes(qLower));

                if (matches) {
                    userMap.set(u.id, { ...u, isInRoom: true });
                }
            });

            return Array.from(userMap.values()).slice(0, 15);
        }

        return [];
    }, [
        showSuggestions,
        triggerType,
        searchQuery,
        taskViewMode,
        selectedProjectId,
        drillDownTasks,
        allProjects,
        roomProjectId,
        roomTasks,
        generalTasks,
        room?.participants,
        room?.isGroup
    ]);

    // Reset active index khi danh sách gợi ý thay đổi
    useEffect(() => {
        setActiveSuggestionIndex(0);
    }, [suggestions]);

    // Kiểm tra editor có nội dung hay không (để ẩn/hiển thị nút gửi và các nút công cụ)
    const checkHasContent = () => {
        if (!editorRef.current) return false;
        const text = editorRef.current.textContent?.trim() || "";
        const hasChips = editorRef.current.querySelector(".inline-mention-user, .inline-mention-task") !== null;
        return text.length > 0 || hasChips;
    };

    // Serialize cây DOM của editor thành chuỗi protocol gửi đi cho backend
    const serializeEditor = (container) => {
        let result = "";
        const traverse = (node) => {
            if (!node) return;
            if (node.nodeType === Node.TEXT_NODE) {
                // Thay thế ký tự non-breaking space \u00A0 thành space chuẩn
                result += node.textContent.replace(/\u00A0/g, " ");
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.dataset?.type === "user") {
                    result += buildUserToken(node.dataset.id, node.dataset.name);
                } else if (node.dataset?.type === "task") {
                    result += buildTaskToken(node.dataset.id, node.dataset.code);
                } else if (node.nodeName === "BR") {
                    result += "\n";
                } else if (node.nodeName === "DIV" || node.nodeName === "P") {
                    if (result && !result.endsWith("\n")) result += "\n";
                    for (const child of node.childNodes) {
                        traverse(child);
                    }
                } else {
                    for (const child of node.childNodes) {
                        traverse(child);
                    }
                }
            }
        };

        for (const child of container.childNodes) {
            traverse(child);
        }
        return result;
    };

    const handleInput = () => {
        const editor = editorRef.current;
        if (!editor) return;

        setHasContent(checkHasContent());

        if (onTyping) {
            onTyping(true);
            if (typingTimeout) clearTimeout(typingTimeout);
            const timeout = setTimeout(() => {
                onTyping(false);
            }, 2000);
            setTypingTimeout(timeout);
        }

        // Lấy vị trí con trỏ hiện tại và kiểm tra trigger '@' hoặc '#'
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;

        if (node.nodeType === Node.TEXT_NODE) {
            const textBefore = node.textContent.slice(0, range.startOffset);
            const atIdx = textBefore.lastIndexOf("@");
            const hashIdx = textBefore.lastIndexOf("#");

            if (hashIdx > atIdx && hashIdx !== -1) {
                if (hashIdx === 0 || /\s/.test(textBefore[hashIdx - 1])) {
                    const query = textBefore.slice(hashIdx + 1);
                    // Cho phép khoảng trắng đơn để gõ tên tiếng Việt có dấu, chỉ hủy khi 2 khoảng trắng hoặc xuống dòng
                    if (!/\n/.test(query) && !/\s{2,}/.test(query) && query.length <= 50) {
                        setShowSuggestions(true);
                        setTriggerType("TASK");
                        setSearchQuery(query);
                        savedRangeRef.current = range.cloneRange();
                        triggerNodeRef.current = node;
                        triggerOffsetRef.current = hashIdx;
                        return;
                    }
                }
            } else if (atIdx !== -1 && room?.isGroup) {
                // CHỈ kích hoạt gợi ý tag người (@) khi đang ở trong nhóm chat (room.isGroup)
                if (atIdx === 0 || /\s/.test(textBefore[atIdx - 1])) {
                    const query = textBefore.slice(atIdx + 1);
                    if (!/\n/.test(query) && !/\s{2,}/.test(query) && query.length <= 50) {
                        setShowSuggestions(true);
                        setTriggerType("USER");
                        setSearchQuery(query);
                        savedRangeRef.current = range.cloneRange();
                        triggerNodeRef.current = node;
                        triggerOffsetRef.current = atIdx;
                        return;
                    }
                }
            }
        }

        setShowSuggestions(false);
        setTriggerType(null);
        setSelectedProjectId(null);
        setTaskViewMode("ALL");
        savedRangeRef.current = null;
        triggerNodeRef.current = null;
        triggerOffsetRef.current = -1;
    };

    // Chèn thẻ mention inline chuẩn Messenger vào editor
    const insertMentionChip = (type, item) => {
        const editor = editorRef.current;
        if (!editor) return;

        // Tạo thẻ mention chip chuẩn Messenger
        const chip = document.createElement("span");
        chip.contentEditable = "false";

        if (type === "TASK") {
            chip.className = "inline-mention-task inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-[#F38820] font-mono font-bold text-[13px] mx-1 select-none align-baseline cursor-default border border-orange-200 shadow-2xs";
            chip.dataset.type = "task";
            chip.dataset.id = item.id;
            chip.dataset.code = item.code;
            chip.innerText = `#${item.code}`;
        } else {
            const displayName = item.fullName || item.username || "Thành viên";
            chip.className = "inline-mention-user inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[13px] mx-1 select-none align-baseline cursor-default border border-blue-200 shadow-2xs";
            chip.dataset.type = "user";
            chip.dataset.id = item.id;
            chip.dataset.name = displayName;
            chip.innerText = `@${displayName}`;
        }

        // Tạo khoảng trắng sau thẻ để người dùng gõ tiếp
        const space = document.createTextNode("\u00A0");

        const sel = window.getSelection();
        let range = savedRangeRef.current;
        if (!range || !editor.contains(range.commonAncestorContainer)) {
            if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                range = sel.getRangeAt(0);
            }
        }

        if (range && triggerNodeRef.current && triggerOffsetRef.current !== -1) {
            const node = triggerNodeRef.current;
            const text = node.textContent || "";
            const triggerPos = triggerOffsetRef.current;
            const before = text.slice(0, triggerPos);
            const endPos = range.endContainer === node ? range.endOffset : (triggerPos + searchQuery.length + 1);
            const after = text.slice(endPos);

            node.textContent = before;
            const parent = node.parentNode;
            const afterNode = document.createTextNode(after);

            const nextSibling = node.nextSibling;
            if (nextSibling) {
                parent.insertBefore(chip, nextSibling);
                parent.insertBefore(space, nextSibling);
                parent.insertBefore(afterNode, nextSibling);
            } else {
                parent.appendChild(chip);
                parent.appendChild(space);
                parent.appendChild(afterNode);
            }

            // Đặt con trỏ ngay sau dấu cách
            const newRange = document.createRange();
            newRange.setStart(space, space.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } else {
            editor.appendChild(chip);
            editor.appendChild(space);
            const newRange = document.createRange();
            newRange.setStart(space, space.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        }

        editor.focus();
        setShowSuggestions(false);
        setTriggerType(null);
        setSearchQuery("");
        setSelectedProjectId(null);
        setTaskViewMode("ALL");
        setHasContent(true);
        savedRangeRef.current = null;
        triggerNodeRef.current = null;
        triggerOffsetRef.current = -1;
    };

    // Lắng nghe sự kiện tag nhanh (@mention) từ MemberProfileModal
    useEffect(() => {
        const handleMentionEvent = (e) => {
            const item = e.detail;
            if (!item || !editorRef.current) return;
            insertMentionChip("USER", item);
        };

        window.addEventListener("chat:mention_user", handleMentionEvent);
        return () => window.removeEventListener("chat:mention_user", handleMentionEvent);
    }, []);

    const handleSelectSuggestion = (item) => {
        if (!item) return;

        if (item.isProjectItem) {
            setSelectedProjectId(item.project.id);
            setActiveSuggestionIndex(0);
            setSearchQuery("");
            if (editorRef.current) editorRef.current.focus();
            return;
        }

        insertMentionChip(triggerType, item);
    };

    // 3. XỬ LÝ CHỌN VÀ TẢI TỆP / HÌNH ẢNH (Nút + và Nút Ảnh)
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        e.target.value = null;

        setIsUploadingAttachment(true);
        try {
            for (const file of files) {
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const uploadRes = await uploadToCloudinary(file, "GETVINI/ERP/chat/attachments");
                const url = uploadRes?.url || uploadRes?.secure_url;
                if (url) {
                    setPendingAttachments(prev => [
                        ...prev,
                        {
                            id: tempId,
                            name: file.name,
                            size: file.size,
                            type: file.type?.startsWith("image/") ? "image" : "file",
                            url
                        }
                    ]);
                }
            }
        } catch (err) {
            console.error("Lỗi khi tải tệp:", err);
        } finally {
            setIsUploadingAttachment(false);
        }
    };

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        e.target.value = null;

        setIsUploadingAttachment(true);
        try {
            for (const file of files) {
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const uploadRes = await uploadToCloudinary(file, "GETVINI/ERP/chat/images");
                const url = uploadRes?.url || uploadRes?.secure_url;
                if (url) {
                    setPendingAttachments(prev => [
                        ...prev,
                        {
                            id: tempId,
                            name: file.name,
                            size: file.size,
                            type: "image",
                            url
                        }
                    ]);
                }
            }
        } catch (err) {
            console.error("Lỗi khi tải hình ảnh:", err);
        } finally {
            setIsUploadingAttachment(false);
        }
    };

    const handleRemovePendingAttachment = (id) => {
        setPendingAttachments(prev => prev.filter(att => att.id !== id));
    };

    // 4. CHÈN EMOJI TẠI VỊ TRÍ CON TRỎ
    const handleInsertEmoji = (emoji) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(emoji);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editor.appendChild(document.createTextNode(emoji));
        }

        setHasContent(checkHasContent());
    };

    // 5. GHI ÂM TIN NHẮN THOẠI (Nút Mic)
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start(200);
            setIsRecording(true);
            setRecordingSeconds(0);

            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Không thể truy cập microphone:", err);
            alert("Không thể truy cập microphone. Vui lòng cấp quyền ghi âm trong cài đặt trình duyệt để gửi tin nhắn thoại.");
        }
    };

    const stopAndCancelRecording = () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingSeconds(0);
    };

    const stopAndSendRecording = async () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const recorder = mediaRecorderRef.current;
        if (!recorder) return;

        recorder.onstop = async () => {
            recorder.stream?.getTracks().forEach(t => t.stop());
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            audioChunksRef.current = [];
            setIsRecording(false);
            const recordedDuration = recordingSeconds;
            setRecordingSeconds(0);

            if (audioBlob.size < 100) return;

            setIsUploadingAttachment(true);
            try {
                const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
                const res = await uploadToCloudinary(audioFile, "GETVINI/ERP/chat/voice");
                const url = res?.url || res?.secure_url;
                if (url) {
                    onSendMessage("🎤 [Tin nhắn thoại]", [
                        {
                            name: `Tin nhắn thoại (${recordedDuration}s)`,
                            size: audioBlob.size,
                            type: "audio",
                            url
                        }
                    ]);
                }
            } catch (err) {
                console.error("Lỗi khi gửi tin nhắn thoại:", err);
            } finally {
                setIsUploadingAttachment(false);
            }
        };

        recorder.stop();
    };

    const formatRecordingTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleKeyDown = (e) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
                return;
            }
        }

        if (e.key === "Escape") {
            e.preventDefault();
            setShowSuggestions(false);
            setShowEmojiPicker(false);
            setTriggerType(null);
            setSelectedProjectId(null);
            setTaskViewMode("ALL");
            return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (isUploadingAttachment) return;
        const editor = editorRef.current;
        if (!editor) return;

        const finalContent = serializeEditor(editor).trim();
        if (!finalContent && pendingAttachments.length === 0) return;

        const contentToSend = finalContent || "";
        onSendMessage(contentToSend, pendingAttachments);

        editor.innerHTML = "";
        setPendingAttachments([]);
        setHasContent(false);
        setShowSuggestions(false);
        setShowEmojiPicker(false);
        setTriggerType(null);
        setSelectedProjectId(null);
        setTaskViewMode("ALL");
        if (onTyping) onTyping(false);
        if (typingTimeout) clearTimeout(typingTimeout);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData("text/plain") || "";
        if (text) {
            document.execCommand("insertText", false, text);
            handleInput();
        }
    };

    useEffect(() => {
        if (suggestionsRef.current && showSuggestions) {
            const activeEl = suggestionsRef.current.querySelector(`[data-index="${activeSuggestionIndex}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ block: "nearest" });
            }
        }
    }, [activeSuggestionIndex, showSuggestions]);

    const isLoading = (isGeneralTaskSearch && loadingGeneralTasks) ||
        (selectedProjectId && loadingDrillDownTasks) ||
        (taskViewMode === "BY_PROJECT" && !selectedProjectId && loadingProjects);

    const canSend = (hasContent || pendingAttachments.length > 0) && !isUploadingAttachment;

    return (
        <div className="relative w-full flex flex-col bg-white px-3 py-2 border-t border-gray-100">
            {/* Hidden file & image inputs */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
            />

            {/* Dải xem trước tệp và hình ảnh đang chờ gửi (Pending Attachments Bar) */}
            {(pendingAttachments.length > 0 || isUploadingAttachment) && (
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1.5 bg-gray-50 border border-gray-200/60 rounded-xl overflow-x-auto animate-fade-in">
                    {pendingAttachments.map(att => (
                        <div
                            key={att.id}
                            className="relative shrink-0 group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs"
                        >
                            {att.type === "image" ? (
                                <div className="w-14 h-14 relative">
                                    <img
                                        src={att.url}
                                        alt={att.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePendingAttachment(att.id)}
                                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow-xs cursor-pointer hover:bg-red-600"
                                        title="Xóa ảnh"
                                    >
                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2 py-1.5 max-w-[180px]">
                                    <Paperclip className="w-3.5 h-3.5 text-[#F38820] shrink-0" />
                                    <span className="text-xs font-mono text-slate-700 truncate" title={att.name}>
                                        {att.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePendingAttachment(att.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer ml-1 shrink-0"
                                        title="Xóa tệp"
                                    >
                                        <X className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {isUploadingAttachment && (
                        <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 font-medium">
                            <Loader2 className="w-4 h-4 text-[#F38820] animate-spin" />
                            <span>Đang tải lên...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Popup chọn Emoji chuẩn Messenger */}
            {showEmojiPicker && (
                <div
                    ref={emojiPickerRef}
                    className="absolute right-4 bottom-full mb-2 w-80 bg-white border border-gray-200 shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col animate-fade-in"
                >
                    {/* Header Emoji tabs */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                        <div className="flex items-center gap-1">
                            {EMOJI_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => setActiveEmojiTab(idx)}
                                    className={`px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                                        activeEmojiTab === idx
                                            ? "bg-orange-100 text-[#F38820] font-bold"
                                            : "text-gray-500 hover:bg-gray-200/60"
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(false)}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Emoji Grid */}
                    <div className="p-3 max-h-56 overflow-y-auto grid grid-cols-7 gap-1 text-xl select-none">
                        {EMOJI_CATEGORIES[activeEmojiTab].emojis.map((emoji, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleInsertEmoji(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-lg transition-transform hover:scale-125 cursor-pointer"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Autocomplete suggestion dropup - Chỉ hiển thị khi có kết quả hoặc đang tải (tự tắt khi gõ không khớp) */}
            {showSuggestions && (isLoading || suggestions.length > 0) && (
                <div
                    ref={suggestionsRef}
                    className="absolute left-16 bottom-full mb-2 w-[390px] max-h-80 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-2xl z-50 divide-y divide-gray-100 flex flex-col"
                >
                    {/* Header info & Mode Switcher */}
                    <div className="px-3 py-2 bg-gray-50 flex items-center justify-between text-[11px] font-semibold text-gray-600 border-b border-gray-100 flex-shrink-0">
                        {triggerType === "TASK" ? (
                            <div className="flex items-center gap-1.5 w-full justify-between">
                                {selectedProject ? (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProjectId(null)}
                                            className="inline-flex items-center gap-1 text-[#F38820] hover:text-[#d97616] font-bold text-xs bg-orange-100/60 px-2 py-0.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                                            title="Quay lại chọn dự án khác"
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                            <span>Dự án khác</span>
                                        </button>
                                        <span className="truncate text-xs font-bold text-slate-800" title={selectedProject.name}>
                                            {selectedProject.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTaskViewMode("ALL");
                                                setSelectedProjectId(null);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                                taskViewMode === "ALL"
                                                    ? "bg-[#F38820] text-white font-bold shadow-xs"
                                                    : "text-gray-600 hover:bg-gray-200/60 font-medium"
                                            }`}
                                        >
                                            <CheckSquare className="w-3 h-3" />
                                            <span>Tất cả task</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTaskViewMode("BY_PROJECT");
                                                setSelectedProjectId(null);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                                taskViewMode === "BY_PROJECT"
                                                    ? "bg-[#F38820] text-white font-bold shadow-xs"
                                                    : "text-gray-600 hover:bg-gray-200/60 font-medium"
                                            }`}
                                        >
                                            <FolderKanban className="w-3 h-3" />
                                            <span>Chọn theo Dự án</span>
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-1">
                                    {isLoading && (
                                        <span className="text-[10px] text-gray-400 font-normal shrink-0">Đang tải...</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSuggestions(false);
                                            setTriggerType(null);
                                            setSelectedProjectId(null);
                                            setTaskViewMode("ALL");
                                        }}
                                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer shrink-0 ml-1"
                                        title="Đóng gợi ý (Esc)"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Gợi ý thành viên (@{searchQuery || "..."})</span>
                                </span>
                                <div className="flex items-center gap-1">
                                    {isLoading && (
                                        <span className="text-[10px] text-gray-400 font-normal">Đang tải...</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSuggestions(false);
                                            setTriggerType(null);
                                            setSelectedProjectId(null);
                                            setTaskViewMode("ALL");
                                        }}
                                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer shrink-0 ml-1"
                                        title="Đóng gợi ý (Esc)"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestions list */}
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {suggestions.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-400">
                                {isLoading ? "Đang tìm kiếm..." : "Không tìm thấy kết quả phù hợp"}
                            </div>
                        ) : (
                            suggestions.map((item, idx) => {
                                const isSelected = idx === activeSuggestionIndex;

                                // 1. Item là DỰ ÁN
                                if (item.isProjectItem) {
                                    const proj = item.project;
                                    return (
                                        <button
                                            key={`proj-${proj.id}`}
                                            type="button"
                                            data-index={idx}
                                            onClick={() => handleSelectSuggestion(item)}
                                            className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                                isSelected ? "bg-orange-50/80 text-[#F38820]" : "text-slate-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#F38820] flex items-center justify-center font-bold text-xs shrink-0">
                                                    📁
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-slate-800 text-xs truncate">
                                                        {proj.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono truncate">
                                                        {proj.code} {proj.customer?.name ? `• ${proj.customer.name}` : ""}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                                        </button>
                                    );
                                }

                                // 2. Item là TASK
                                if (triggerType === "TASK") {
                                    return (
                                        <button
                                            key={`task-${item.id}`}
                                            type="button"
                                            data-index={idx}
                                            onClick={() => handleSelectSuggestion(item)}
                                            className={`w-full text-left px-3 py-2 text-xs flex flex-col transition-colors cursor-pointer ${
                                                isSelected ? "bg-orange-50 text-[#F38820]" : "text-slate-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-xs text-[#F38820] bg-orange-100/70 px-1.5 py-0.5 rounded shrink-0">
                                                    {item.code}
                                                </span>
                                                <span className="truncate font-medium text-slate-800 text-xs">
                                                    {item.name}
                                                </span>
                                            </div>
                                            {item.nickname && (
                                                <span className="text-[10px] text-gray-500 italic mt-0.5 truncate">
                                                    Biệt danh: {item.nickname}
                                                </span>
                                            )}
                                        </button>
                                    );
                                }

                                // 3. Item là USER
                                const displayName = item.fullName || item.username || "Thành viên";
                                const initial = displayName[0]?.toUpperCase() || "U";
                                return (
                                    <button
                                        key={`user-${item.id}`}
                                        type="button"
                                        data-index={idx}
                                        onClick={() => handleSelectSuggestion(item)}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                                            isSelected ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        {item.avatarUrl ? (
                                            <img
                                                src={item.avatarUrl}
                                                alt={displayName}
                                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {initial}
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-slate-900 text-xs truncate">
                                                    {displayName}
                                                </span>
                                                {item.isInRoom && (
                                                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-600 rounded font-medium border border-emerald-200">
                                                        Trong nhóm
                                                    </span>
                                                )}
                                            </div>
                                            {item.nickname && (
                                                <span className="text-[10px] text-gray-500 truncate">
                                                    @{item.nickname}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Messenger Input Bar */}
            <div className="flex items-end gap-2">
                {/* 1. NÚT (+) : Thêm tệp đính kèm (File / Tài liệu / Zip / Excel / PDF) */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0 mb-0.5 cursor-pointer"
                    title="Đính kèm tệp / tài liệu"
                >
                    <PlusCircle className="w-[22px] h-[22px] stroke-[2.4]" />
                </button>

                {/* 2 & 3. NÚT MIC & ẢNH : Chỉ ẩn khi đã nhập văn bản hoặc đang ghi âm */}
                {!hasContent && !isRecording && (
                    <>
                        {/* NÚT MIC : Ghi âm tin nhắn thoại */}
                        <button
                            type="button"
                            onClick={startRecording}
                            className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0 mb-0.5 cursor-pointer"
                            title="Ghi âm tin nhắn thoại"
                        >
                            <Mic className="w-[21px] h-[21px] stroke-[2.4]" />
                        </button>

                        {/* NÚT ẢNH : Chọn hình ảnh từ máy tính */}
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0 mb-0.5 cursor-pointer"
                            title="Gửi hình ảnh"
                        >
                            <Image className="w-[21px] h-[21px] stroke-[2.4]" />
                        </button>
                    </>
                )}

                {/* Khi đang ghi âm tin nhắn thoại -> Hiển thị thanh đếm thời gian ghi âm */}
                {isRecording ? (
                    <div className="flex-1 min-w-0 bg-red-50/90 border border-red-200/80 rounded-[20px] px-4 py-1.5 flex items-center justify-between transition-all">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                            <span className="text-xs font-mono font-bold text-red-600">
                                {formatRecordingTime(recordingSeconds)}
                            </span>
                            <span className="text-xs text-red-600 font-medium">Đang ghi âm giọng nói...</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={stopAndCancelRecording}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-100/70 transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={stopAndSendRecording}
                                className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                                title="Gửi bản ghi âm"
                            >
                                <SendHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Messenger Text Area Capsule */
                    <div className="flex-1 min-w-0 bg-[#f0f2f5] hover:bg-[#ebedf0] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#F38820]/40 rounded-[20px] px-3.5 py-1.5 flex items-center gap-2 transition-all">
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            data-placeholder={room?.isGroup ? "Aa (@ để tag thành viên, # để tag công việc)" : "Aa (# để tag công việc)"}
                            className="chat-messenger-editor flex-1 min-w-0 max-h-32 overflow-y-auto outline-none text-[15px] leading-snug text-slate-800 font-sans cursor-text whitespace-pre-wrap break-words"
                            style={{ minHeight: "22px" }}
                        />

                        {/* NÚT BIỂU CẢM (Smile) : Chọn Emoji */}
                        <button
                            type="button"
                            data-emoji-trigger
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-7 h-7 flex items-center justify-center text-[#F38820] hover:text-[#d97616] transition-colors flex-shrink-0 cursor-pointer"
                            title="Chọn biểu cảm Emoji"
                        >
                            <Smile className="w-[21px] h-[21px] stroke-[2.4]" />
                        </button>
                    </div>
                )}

                {/* Right Send Action Button */}
                {canSend && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isUploadingAttachment}
                        className="w-9 h-8 flex items-center justify-center text-[#F38820] hover:text-[#d97616] flex-shrink-0 transition-colors mb-0.5 cursor-pointer disabled:opacity-50"
                        title="Gửi tin nhắn"
                    >
                        {isUploadingAttachment ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <SendHorizontal className="w-[26px] h-[26px] stroke-[2.6]" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
