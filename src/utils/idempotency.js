import { useState, useCallback } from 'react';

/**
 * Sinh UUID v4 cho Idempotency-Key theo chuẩn RFC 4122
 */
export const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Hook quản lý Idempotency-Key theo vòng đời Form.
 * Giữ nguyên key trong suốt quá trình người dùng thao tác và retry khi lỗi mạng.
 * Chỉ đổi key mới khi submit thành công hoặc người dùng chủ động reset/mở mới form.
 */
export const useIdempotentKey = () => {
  const [key, setKey] = useState(generateIdempotencyKey);
  const resetKey = useCallback(() => setKey(generateIdempotencyKey()), []);
  return [key, resetKey];
};
