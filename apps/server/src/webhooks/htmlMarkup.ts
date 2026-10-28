import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import type { NoticeMarkup } from './noticeBodyOf';

const htmlMarkup: NoticeMarkup = {
  escape: escapeHtml,
  bold: (escaped) => `<b>${escaped}</b>`,
};

export { htmlMarkup };
