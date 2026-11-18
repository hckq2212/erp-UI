import createDOMPurify from 'dompurify';

let purifyInstance = null;

const getDOMPurify = () => {
  if (purifyInstance) return purifyInstance;
  const currentWindow = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis.window : null);
  if (currentWindow) {
    purifyInstance = typeof createDOMPurify === 'function' ? createDOMPurify(currentWindow) : createDOMPurify;
    if (purifyInstance?.addHook) {
      purifyInstance.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          node.setAttribute('rel', 'noopener noreferrer');
          if (node.getAttribute('target')) {
            node.setAttribute('target', '_blank');
          }
        }
      });
    }
  }
  return purifyInstance;
};

export const sanitizeHtml = (html) => {
  if (!html) return '';

  const purify = getDOMPurify();
  if (purify?.sanitize) {
    return purify.sanitize(html, {
      ALLOWED_TAGS: [
        'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'p', 'br',
        'ul', 'ol', 'li', 'a', 'blockquote', 'div', 'span', 'img', 'video',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'class', 'alt', 'src', 'controls', 'muted',
        'data-media-type', 'data-mention', 'data-mention-id', 'contenteditable'
      ],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  }

  // Fallback an toàn khi chạy ngoài browser (Node/test runner)
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript\s*:/gi, '');
};

export const htmlToPlainText = (html) => {
  if (!html) return '';
  // Chèn khoảng trắng ở ranh giới các thẻ dạng block/br để chữ không bị dính liền nhau
  const withBreaks = html.replace(/<\s*(br|\/p|\/div|\/li|\/blockquote|\/h[1-6])[^>]*>/gi, ' ');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};

export const isHtmlEmpty = (html) => htmlToPlainText(html).length === 0;

export const extractMediaFromHtml = (html) => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = [...doc.querySelectorAll('img.editor-media, video.editor-media')];
  return nodes.map((node) => ({
    url: node.getAttribute('src') || '',
    type: node.getAttribute('data-media-type') === 'video' || node.tagName === 'VIDEO' ? 'video' : 'image',
    name: node.getAttribute('alt') || '',
  })).filter((m) => m.url);
};

export const extractMentionsFromHtml = (html) => {
  if (!html) return { userIds: [], hasEveryone: false };
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = [...doc.querySelectorAll('span[data-mention]')];
  const userIds = [];
  let hasEveryone = false;
  nodes.forEach((node) => {
    const id = node.getAttribute('data-mention-id');
    if (!id) return;
    if (id === 'everyone') {
      hasEveryone = true;
    } else {
      userIds.push(id);
    }
  });
  return { userIds: [...new Set(userIds)], hasEveryone };
};
