import { describe, expect, it } from 'vitest';
import { markdownMarkup } from './markdownMarkup';

describe('markdownMarkup', () => {
  it('escapes what Markdown would read as formatting', () => {
    expect(markdownMarkup.escape('*NSYNC_live [2001] <b>')).toBe(
      '\\*NSYNC\\_live \\[2001\\] \\<b\\>',
    );
  });

  it('leaves ordinary punctuation alone', () => {
    expect(markdownMarkup.escape('The Long Night: Part Two (2024) — 4K.')).toBe(
      'The Long Night: Part Two (2024) — 4K.',
    );
  });

  it('leaves a web address whole, for the receiver to link', () => {
    expect(markdownMarkup.escape('See https://docs.getvalence.app/a_b#vpn_down now_')).toBe(
      'See https://docs.getvalence.app/a_b#vpn_down now\\_',
    );
  });

  it('marks text bold', () => {
    expect(markdownMarkup.bold('Status:')).toBe('**Status:**');
  });

  it('sets text as code, which cannot hold a backtick of its own', () => {
    expect(markdownMarkup.code('A`Release_x')).toBe('`AˋRelease_x`');
  });

  it('quotes every line of the text', () => {
    expect(markdownMarkup.quote('the tunnel\nclosed')).toBe('> the tunnel\n> closed');
  });

  it('links a label to an address, keeping a bracket in the address from ending the link', () => {
    expect(markdownMarkup.link('How to fix it', 'https://docs.getvalence.app/a_(b)')).toBe(
      '[How to fix it](https://docs.getvalence.app/a_(b%29)',
    );
  });

  it('writes a line of a list with a dash', () => {
    expect(markdownMarkup.bullet('One')).toBe('- One');
  });
});
