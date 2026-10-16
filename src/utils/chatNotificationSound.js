/**
 * chatNotificationSound.js
 * Tạo âm thanh thông báo "Ting" tinh tế bằng Web Audio API
 * Không phụ thuộc vào tệp mp3 ngoài, không lo lỗi 404, độ trễ 0ms.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Lắng nghe tương tác người dùng đầu tiên để unlock AudioContext (theo chính sách Autoplay của trình duyệt)
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
}

/**
 * Phát âm thanh "Ting" 2 âm bổng mượt mà (Messenger-style)
 * @param {number} volume - Âm lượng từ 0.0 đến 1.0 (mặc định 0.25 vừa vặn, không chói tai)
 */
export function playMessageNotificationSound(volume = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Âm 1: Tần số 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.7, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);

    // Âm 2: Tần số 880 Hz (A5) nảy cao hơn một chút tạo cảm giác tươi vui
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(volume, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}

/**
 * Yêu cầu cấp quyền Desktop Notification từ người dùng
 */
export async function requestDesktopNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return Notification.permission;
    }
  }

  return Notification.permission;
}

/**
 * Hiển thị thông báo màn hình Desktop khi người dùng đang ở tab khác hoặc thu nhỏ cửa sổ
 * @param {Object} options
 * @param {string} options.title - Tiêu đề thông báo (Tên người gửi hoặc tên nhóm)
 * @param {string} options.body - Nội dung tóm tắt tin nhắn
 * @param {string} [options.icon] - Link avatar người gửi
 * @param {Function} [options.onClick] - Callback khi click vào popup thông báo
 */
export function showDesktopNotification({ title, body, icon, onClick }) {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const notification = new Notification(title, {
      body: body || "Đã gửi một tin nhắn mới",
      icon: icon || "/favicon.ico",
      tag: "chat-message", // Gom các thông báo chat lại để không spam màn hình
      renotify: true,
      silent: true // Đã có âm thanh riêng Web Audio
    });

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();
      if (typeof onClick === "function") {
        onClick();
      }
      notification.close();
    };

    // Tự động đóng sau 5 giây nếu không bấm
    setTimeout(() => {
      try {
        notification.close();
      } catch {}
    }, 5000);

    return notification;
  } catch (err) {
    console.warn("Could not show desktop notification:", err);
    return null;
  }
}
