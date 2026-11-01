import type { NoticeMarkup } from './noticeBodyOf';

const MARKDOWN = /[\\*_~`|[\]<]/g;

const STARTS_A_BLOCK = /^([#>-])/gm;

const STARTS_A_NUMBERED_LIST = /^(\d+)\./gm;

const BACKTICK = /`/g;

const discordMarkup: NoticeMarkup = {
  escape: (text) =>
    text
      .replace(MARKDOWN, '\\$&')
      .replace(STARTS_A_BLOCK, '\\$1')
      .replace(STARTS_A_NUMBERED_LIST, '$1\\.'),
  bold: (escaped) => `**${escaped}**`,
  code: (text) => `\`${text.replace(BACKTICK, 'ˋ')}\``,
  quote: (escaped) =>
    escaped
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n'),
  link: (escapedLabel, url) => `[${escapedLabel}](${url})`,
  bullet: (escaped) => `- ${escaped}`,
  small: (escaped) => `-# ${escaped}`,
};

export { discordMarkup };
