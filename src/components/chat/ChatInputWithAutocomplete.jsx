import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PlusCircle, Image, Smile, SendHorizontal } from "lucide-react";

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
                const response = await axios.get(`http://localhost:3000/api/tasks`, {
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
        <div className="relative w-full flex flex-col bg-white px-4 py-3 border-t border-gray-100">
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
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                                }`}
                        >
                            <span className="font-mono font-bold text-emerald-600">{task.code}</span>
                            <span className="truncate mt-0.5 text-[10px] text-gray-400">{task.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Messenger Input Bar */}
            <div className="flex items-center gap-2.5">
                {/* Left Tool Icons */}
                <button type="button" className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1 flex-shrink-0">
                    <PlusCircle className="w-[21px] h-[21px]" />
                </button>
                <button type="button" className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1 flex-shrink-0">
                    <Image className="w-[21px] h-[21px]" />
                </button>
                <button type="button" className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1 flex-shrink-0">
                    <Smile className="w-[21px] h-[21px]" />
                </button>
                <button type="button" className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1 flex-shrink-0 font-bold text-xs">
                    GIF
                </button>

                {/* Text Area Input */}
                <div className="flex-1 bg-[#f0f2f5] rounded-full px-4 py-1.5 flex items-center">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={text}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Aa"
                        className="flex-1 bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 resize-none max-h-24 text-sm py-1 font-sans"
                        style={{ minHeight: "22px" }}
                    />
                </div>

                {/* Right Send Action Button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className={`p-1.5 flex-shrink-0 transition-colors ${text.trim()
                            ? "text-[#0084ff] hover:text-[#0073de]"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                >
                    <SendHorizontal className="w-[20px] h-[20px]" />
                </button>
            </div>
        </div>
    );
}
