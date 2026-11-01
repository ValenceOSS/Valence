import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import type { NoticeMarkup } from './noticeBodyOf';

const pushoverMarkup: NoticeMarkup = {
  escape: escapeHtml,
  bold: (escaped) => `<b>${escaped}</b>`,
  code: escapeHtml,
  quote: (escaped) => `<i>${escaped}</i>`,
  link: (escapedLabel, url) => `<a href="${escapeHtml(url)}">${escapedLabel}</a>`,
  bullet: (escaped) => `• ${escaped}`,
  small: (escaped) => escaped,
};

export { pushoverMarkup };
