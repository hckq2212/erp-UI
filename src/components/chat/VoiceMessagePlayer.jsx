import React, { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

const WAVEFORM_BARS = [
    3, 4, 6, 10, 14, 8, 12, 16, 11, 9, 15, 18, 13, 10, 15, 17, 12, 8, 13, 16, 10, 7, 11, 13, 8, 5, 4, 3
];

export const normalizeAudioPlaybackUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    // Trình duyệt máy tính (Chrome, Edge, Firefox, Safari) không thể giải mã định dạng .3gp / .amr của Android
    // Nếu là file Cloudinary, chuyển đuôi .3gp / .amr sang .mp3 để Cloudinary tự động transcode audio/mpeg tương thích 100%
    if (url.includes("res.cloudinary.com")) {
        return url.replace(/\.(3gp|3gpp|amr)($|\?)/i, ".mp3$2");
    }
    return url;
};

export function VoiceMessagePlayer({ src, fileName, isMe = false }) {
    const audioRef = useRef(null);
    const waveformRef = useRef(null);
    const playerId = useMemo(() => `voice_${Math.random().toString(36).substring(2, 9)}`, []);

    const playableSrc = useMemo(() => normalizeAudioPlaybackUrl(src), [src]);

    // Parse duration hint from fileName (e.g. "Tin nhắn thoại (3s)" => 3)
    const initialDuration = useMemo(() => {
        if (!fileName) return 0;
        const match = fileName.match(/\((\d+)\s*s\)/i);
        return match ? parseInt(match[1], 10) : 0;
    }, [fileName]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState(initialDuration);
    const [currentTime, setCurrentTime] = useState(0);

    // Dừng phát khi người dùng phát một tin nhắn thoại khác
    useEffect(() => {
        const handleOtherPlay = (e) => {
            if (e.detail?.id !== playerId && isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            }
        };

        window.addEventListener("chat:voice_play", handleOtherPlay);
        return () => window.removeEventListener("chat:voice_play", handleOtherPlay);
    }, [playerId, isPlaying]);

    useEffect(() => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = playableSrc;
        audioRef.current = audio;

        const onLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0 && isFinite(audio.duration)) {
                setDuration(Math.round(audio.duration));
            }
            setIsLoading(false);
        };

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime || 0);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const onError = () => {
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);

        return () => {
            audio.pause();
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            audioRef.current = null;
        };
    }, [src]);

    const togglePlay = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            // Thông báo cho các voice player khác dừng phát
            window.dispatchEvent(new CustomEvent("chat:voice_play", { detail: { id: playerId } }));
            setIsLoading(true);
            audio
                .play()
                .then(() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                })
                .catch(() => {
                    setIsPlaying(false);
                    setIsLoading(false);
                });
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        const waveform = waveformRef.current;
        if (!audio || !waveform) return;

        const rect = waveform.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        const totalDuration = duration > 0 ? duration : (audio.duration || initialDuration || 0);
        if (totalDuration > 0) {
            const targetTime = pct * totalDuration;
            audio.currentTime = targetTime;
            setCurrentTime(targetTime);
        }
    };

    const formatTimer = (seconds) => {
        const total = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // Tính tỷ lệ thanh sóng âm thanh đã chạy qua
    const effectiveDuration = duration > 0 ? duration : initialDuration;
    const progressRatio = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;
    const activeBarCount = Math.round(progressRatio * WAVEFORM_BARS.length);

    // Thời gian hiển thị: đang phát thì hiện currentTime, dừng thì hiện tổng thời lượng
    const displayTime = isPlaying || currentTime > 0
        ? formatTimer(currentTime)
        : formatTimer(effectiveDuration);

    // Màu sắc theo chuẩn thiết kế Getvini (#F38820)
    // isMe (trên nền cam Getvini): Nút tròn trắng nổi bật, sóng âm thanh trắng / trắng mờ, text trắng
    // !isMe (trên nền xám #F0F2F5): Nút tròn cam Getvini, sóng âm thanh cam / xám, text xám đậm
    const btnBg = isMe ? "bg-white hover:bg-white/95 text-[#F38820]" : "bg-[#F38820] hover:bg-[#E07715] text-white";
    const activeBarColor = isMe ? "#FFFFFF" : "#F38820";
    const inactiveBarColor = isMe ? "rgba(255, 255, 255, 0.4)" : "#CBD5E1";
    const timerTextColor = isMe ? "text-white" : "text-slate-600";

    return (
        <div className="flex items-center gap-3 py-1 px-1 select-none max-w-[270px]">
            {/* Nút Play / Pause tròn chuẩn thiết kế */}
            <button
                type="button"
                onClick={togglePlay}
                disabled={isLoading}
                title={isPlaying ? "Tạm dừng" : "Phát tin nhắn thoại"}
                className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center shadow-xs cursor-pointer transition-transform duration-150 active:scale-92 ${btnBg}`}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
            </button>

            {/* Dải sóng âm thanh Waveform (bấm để tua) */}
            <div
                ref={waveformRef}
                onClick={handleSeek}
                title="Bấm để tua âm thanh"
                className="flex items-center gap-[2.5px] h-6 flex-1 cursor-pointer py-1"
            >
                {WAVEFORM_BARS.map((height, idx) => {
                    const isActive = idx < activeBarCount;
                    return (
                        <div
                            key={idx}
                            style={{
                                height: `${height}px`,
                                backgroundColor: isActive ? activeBarColor : inactiveBarColor,
                                width: "2.5px",
                                borderRadius: "2px"
                            }}
                            className="transition-colors duration-100 flex-shrink-0"
                        />
                    );
                })}
            </div>

            {/* Bộ đếm thời gian (mm:ss) */}
            <span className={`text-xs font-semibold tabular-nums tracking-tight flex-shrink-0 min-w-[28px] text-right ${timerTextColor}`}>
                {displayTime}
            </span>
        </div>
    );
}
