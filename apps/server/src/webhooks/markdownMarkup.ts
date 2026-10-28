import type { NoticeMarkup } from './noticeBodyOf';

const WEB_ADDRESS = /(https?:\/\/\S+)/;

/**
 * Escapes the characters Markdown would otherwise read as formatting, so a title with an asterisk or
 * an underscore in it arrives as it was written, while a web address is left whole for the receiver
 * to turn into a link.
 *
 * @param text - The text.
 * @returns The text, safe to put in Markdown.
 */
const escapeMarkdown = (text: string): string =>
  text
    .split(WEB_ADDRESS)
    .map((part) => (WEB_ADDRESS.test(part) ? part : part.replace(/[\\`*_[\]<>]/g, '\\$&')))
    .join('');

const markdownMarkup: NoticeMarkup = {
  escape: escapeMarkdown,
  bold: (escaped) => `**${escaped}**`,
};

export { markdownMarkup };
