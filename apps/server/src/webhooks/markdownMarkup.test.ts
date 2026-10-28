import { describe, expect, it } from 'vitest';
import { markdownMarkup } from './markdownMarkup';

describe('markdownMarkup', () => {
  it('escapes what Markdown would read as formatting', () => {
    expect(markdownMarkup.escape('*NSYNC_live [2001] <b>')).toBe(
      '\\*NSYNC\\_live \\[2001\\] \\<b\\>',
    );
  });

  it('leaves ordinary punctuation alone', () => {
    expect(markdownMarkup.escape('Dune: Part Two (2024) — 4K.')).toBe(
      'Dune: Part Two (2024) — 4K.',
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
});
