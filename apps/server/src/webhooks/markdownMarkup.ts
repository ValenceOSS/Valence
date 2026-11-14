import type { NoticeMarkup } from './noticeBodyOf';

const WEB_ADDRESS = /(https?:\/\/\S+)/;

/**
 * Makes a web address safe to sit in Markdown: the characters that would turn it into a link of
 * somebody else's wording, or an image, are written as their percent codes, so what is left is only
 * the address.
 *
 * @param address - The address, as far as the next space.
 * @returns The address, without a character Markdown would read.
 */
const plainAddress = (address: string): string =>
  address.replace(
    /[\\[\]()<>`]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

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
    .map((part) =>
      WEB_ADDRESS.test(part) ? plainAddress(part) : part.replace(/[\\`*_[\]<>]/g, '\\$&'),
    )
    .join('');

const markdownMarkup: NoticeMarkup = {
  escape: escapeMarkdown,
  bold: (escaped) => `**${escaped}**`,
  code: (text) => `\`${text.replaceAll('`', 'ˋ')}\``,
  quote: (escaped) =>
    escaped
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n'),
  link: (escapedLabel, url) => `[${escapedLabel}](${url.replaceAll(')', '%29')})`,
  bullet: (escaped) => `- ${escaped}`,
  small: (escaped) => escaped,
};

export { markdownMarkup };
