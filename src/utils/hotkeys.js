export const IS_MAC =
  typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || '');

export const MOD_LABEL = IS_MAC ? '⌘' : 'Ctrl';

export const hasMod = (event) => Boolean(event.ctrlKey || event.metaKey);

export const isTypingTarget = (event) => {
  const el = event.target;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(el.isContentEditable);
};
