export const getCurrentUserId = (user) => {
  if (!user) return null;
  return user.userId || user.user?.id || user.profile?.id || user.id || null;
};

export const isSameUser = (leftId, rightId) => {
  if (!leftId || !rightId) return false;
  return String(leftId) === String(rightId);
};

export const getUserAccountRole = (user) => {
  return user?.account?.role || user?.accounts?.[0]?.role || user?.role || null;
};
