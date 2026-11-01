import { describe, expect, it } from 'vitest';
import { discordMarkup } from './discordMarkup';

describe('discordMarkup', () => {
  it('keeps text from elsewhere from being read as formatting', () => {
    expect(discordMarkup.escape('*bold* _it_ `code` |spoiler| [link](x)')).toBe(
      '\\*bold\\* \\_it\\_ \\`code\\` \\|spoiler\\| \\[link\\](x)',
    );
  });

  it('keeps a mention from being drawn as one', () => {
    expect(discordMarkup.escape('<@123> <@&456>')).toBe('\\<@123> \\<@&456>');
  });

  it('keeps a line from starting a heading, a quote, a list or a numbered list', () => {
    expect(discordMarkup.escape('# a\n> b\n- c\n1. d')).toBe('\\# a\n\\> b\n\\- c\n1\\. d');
  });

  it('sets code that cannot hold a backtick of its own', () => {
    expect(discordMarkup.code('a`b')).toBe('`aˋb`');
  });

  it('quotes every line, draws a small line, a bullet, bold and a link', () => {
    expect(discordMarkup.quote('one\ntwo')).toBe('> one\n> two');
    expect(discordMarkup.small('fine print')).toBe('-# fine print');
    expect(discordMarkup.bullet('item')).toBe('- item');
    expect(discordMarkup.bold('name')).toBe('**name**');
    expect(discordMarkup.link('How to fix it', 'https://example.com/a')).toBe(
      '[How to fix it](https://example.com/a)',
    );
  });
});
