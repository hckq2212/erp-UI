import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Image, Mic, PlusCircle, SendHorizontal, Smile, Sticker } from "lucide-react";
import { BASE_URL } from "../../store/api";

export function ChatInputWithAutocomplete({ onSendMessage, onTyping }) {
    const [text, setText] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [triggerIdx, setTriggerIdx] = useState(-1);
    const [typingTimeout, setTypingTimeout] = useState(null);

    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Fetch tasks matching searchQuery
    useEffect(() => {
        if (!showSuggestions || searchQuery.length < 1) {
            setSuggestions([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                const response = await axios.get(`${BASE_URL}/tasks`, {
                    params: { q: searchQuery, limit: 10 },
                    withCredentials: true
                });

                const taskItems = response.data.data || [];
                setSuggestions(taskItems);
                setActiveSuggestionIndex(0);
            } catch (error) {
                console.error("Error searching tasks:", error);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, showSuggestions]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setText(val);

        if (onTyping) {
            onTyping(true);
            if (typingTimeout) clearTimeout(typingTimeout);

            const timeout = setTimeout(() => {
                onTyping(false);
            }, 2000);
            setTypingTimeout(timeout);
        }

        const cursorIdx = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorIdx);

        const lastAtIdx = textBeforeCursor.lastIndexOf("@");

        if (lastAtIdx !== -1 && (lastAtIdx === 0 || /\s/.test(textBeforeCursor[lastAtIdx - 1]))) {
            const currentQuery = textBeforeCursor.slice(lastAtIdx + 1);
            if (!/\s/.test(currentQuery)) {
                setShowSuggestions(true);
                setSearchQuery(currentQuery);
                setTriggerIdx(lastAtIdx);
                return;
            }
        }

        setShowSuggestions(false);
    };

    const handleSelectSuggestion = (task) => {
        if (triggerIdx === -1) return;

        const val = text;
        const textBeforeAt = val.slice(0, triggerIdx);
        const textAfterCursor = val.slice(inputRef.current.selectionStart);

        const insertText = `@{${task.code}} `;
        const newText = textBeforeAt + insertText + textAfterCursor;

        setText(newText);
        setShowSuggestions(false);
        setTriggerIdx(-1);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newCursorIdx = triggerIdx + insertText.length;
                inputRef.current.setSelectionRange(newCursorIdx, newCursorIdx);
            }
        }, 10);
    };

    const handleKeyDown = (e) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (e.key === "Escape") {
                e.preventDefault();
                setShowSuggestions(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed) return;

        onSendMessage(trimmed);
        setText("");
        if (onTyping) onTyping(false);
        if (typingTimeout) clearTimeout(typingTimeout);
    };

    useEffect(() => {
        if (suggestionsRef.current && showSuggestions) {
            const activeEl = suggestionsRef.current.childNodes[activeSuggestionIndex];
            if (activeEl) {
                activeEl.scrollIntoView({ block: "nearest" });
            }
        }
    }, [activeSuggestionIndex, showSuggestions]);

    return (
        <div className="relative w-full flex flex-col bg-white px-3 py-2 border-t border-gray-100">
            {/* Autocomplete suggestion dropup */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute left-16 bottom-full mb-2 w-72 max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-2xl z-50 divide-y divide-gray-100"
                >
                    {suggestions.map((task, idx) => (
                        <button
                            key={task.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(task)}
                            className={`w-full text-left px-4 py-2 text-xs flex flex-col transition-colors ${idx === activeSuggestionIndex
                                ? "bg-orange-50 text-[#F38820]"
                                : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                                }`}
                        >
                            <span className="font-mono font-bold text-[#F38820]">{task.code}</span>
                            <span className="truncate mt-0.5 text-[10px] text-gray-400">{task.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Messenger Input Bar */}
            <div className="flex h-10 items-center gap-2">
                {/* Left Tool Icons */}
                <button type="button" className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0" title="Thêm">
                    <PlusCircle className="w-[22px] h-[22px] stroke-[2.4]" />
                </button>
                {!text.trim() && (
                    <>
                        <button type="button" className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0" title="Ghi âm">
                            <Mic className="w-[21px] h-[21px] stroke-[2.4]" />
                        </button>
                        <button type="button" className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0" title="Ảnh">
                            <Image className="w-[21px] h-[21px] stroke-[2.4]" />
                        </button>
                        {/* <button type="button" className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0" title="Sticker">
                            <Sticker className="w-[21px] h-[21px] stroke-[2.4]" />
                        </button> */}
                        {/* <button type="button" className="w-8 h-8 text-[#F38820] hover:text-[#d97616] transition-colors flex items-center justify-center flex-shrink-0 font-black text-[11px]" title="GIF">
                            GIF
                        </button> */}
                    </>
                )}

                {/* Text Area Input */}
                <div className="flex-1 min-w-0 h-9 bg-orange-50 rounded-full px-3 flex items-center gap-2">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={text}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Aa"
                        className="flex-1 min-w-0 h-6 bg-transparent border-0 outline-none text-slate-800 placeholder-slate-500 resize-none max-h-24 text-[16px] leading-6 py-0 font-sans"
                        style={{ minHeight: "24px" }}
                    />
                    <button type="button" className="w-7 h-7 flex items-center justify-center text-[#F38820] hover:text-[#d97616] transition-colors flex-shrink-0" title="Biểu cảm">
                        <Smile className="w-[21px] h-[21px] stroke-[2.4]" />
                    </button>
                </div>

                {/* Right Send Action Button */}
                {text.trim() && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-9 h-8 flex items-center justify-center text-[#F38820] hover:text-[#d97616] flex-shrink-0 transition-colors"
                        title="Gửi"
                    >
                        <SendHorizontal className="w-[26px] h-[26px] stroke-[2.6]" />
                    </button>
                )}
            </div>
        </div>
    );
}
