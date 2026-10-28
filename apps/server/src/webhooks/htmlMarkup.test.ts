import { describe, expect, it } from 'vitest';
import { htmlMarkup } from './htmlMarkup';

describe('htmlMarkup', () => {
  it('escapes what HTML would read as markup', () => {
    expect(htmlMarkup.escape('Tom & Jerry <3')).toBe('Tom &amp; Jerry &lt;3');
  });

  it('marks text bold', () => {
    expect(htmlMarkup.bold('Status:')).toBe('<b>Status:</b>');
  });
});
