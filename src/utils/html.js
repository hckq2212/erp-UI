const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'P', 'BR',
  'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'DIV', 'SPAN', 'IMG', 'VIDEO',
]);

const ALLOWED_ATTRS = {
  A: ['href', 'target', 'rel'],
  IMG: ['src', 'alt', 'class', 'data-media-type'],
  VIDEO: ['src', 'controls', 'muted', 'class', 'data-media-type'],
  SPAN: ['class', 'data-mention', 'data-mention-id', 'contenteditable'],
};

export const sanitizeHtml = (html) => {
  if (!html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!ALLOWED_TAGS.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }

        [...child.attributes].forEach((attr) => {
          const allowed = ALLOWED_ATTRS[child.tagName] || [];
          if (!allowed.includes(attr.name) || attr.value.trim().toLowerCase().startsWith('javascript:')) {
            child.removeAttribute(attr.name);
          }
        });

        if (child.tagName === 'A') {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }

        clean(child);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };

  clean(doc.body);
  return doc.body.innerHTML;
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
