import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import type { NoticeMarkup } from './noticeBodyOf';

const htmlMarkup: NoticeMarkup = {
  escape: escapeHtml,
  bold: (escaped) => `<b>${escaped}</b>`,
  code: (text) => `<code>${escapeHtml(text)}</code>`,
  quote: (escaped) => `<blockquote>${escaped}</blockquote>`,
  link: (escapedLabel, url) => `<a href="${escapeHtml(url)}">${escapedLabel}</a>`,
  bullet: (escaped) => `• ${escaped}`,
  small: (escaped) => escaped,
};

export { htmlMarkup };
