import { load } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { readHtmlSelector } from './readHtmlSelector';
import { SelectorMiss } from './SelectorMiss';
import type { CardigannSelector } from './CardigannDefinitionSchema';

const PAGE = `<html><body>
  <div id="site">Tracker</div>
  <table><tr class="row">
    <td class="name"><a href="details.php?id=7" title="Dune (2021)">Dune</a> <span class="tag">NEW</span></td>
    <td class="size">7.5 GB</td>
    <td class="free"><img class="pro_free"></td>
  </tr></table>
</body></html>`;

const CONTEXT = { variables: { '.Result._id': '7' }, encoding: 'UTF-8', nowMs: 0 };

/**
 * Reads from the one row of a fresh copy of the page.
 */
const read = (block: Partial<CardigannSelector>, isRequired = true) => {
  const $ = load(PAGE);

  return readHtmlSelector(
    $,
    $('tr.row'),
    { optional: false, filters: [], ...block },
    CONTEXT,
    isRequired,
  );
};

describe('readHtmlSelector', () => {
  it('reads the text of what the selector finds', () => {
    expect(read({ selector: 'td.size' })).toBe('7.5 GB');
  });

  it('reads an attribute, and applies filters', () => {
    expect(
      read({ selector: 'a', attribute: 'href', filters: [{ name: 'querystring', args: 'id' }] }),
    ).toBe('7');
  });

  it('reads fixed text through the templates', () => {
    expect(read({ text: 'details.php?id={{ .Result._id }}' })).toBe('details.php?id=7');
  });

  it('reads the row itself where the selector matches it', () => {
    expect(read({ selector: 'tr.row', attribute: 'class' })).toBe('row');
  });

  it('reads from the top of the page with :root', () => {
    expect(read({ selector: ':root div#site' })).toBe('Tracker');
  });

  it('removes what it is told to before reading', () => {
    expect(read({ selector: 'td.name', remove: 'span.tag' })).toBe('Dune');
  });

  it('chooses the first case that matches, with * as the fallback', () => {
    expect(read({ case: { 'img.pro_half': '0.5', 'img.pro_free': '0', '*': '1' } })).toBe('0');
    expect(read({ selector: 'td.size', case: { 'img.pro_free': '0', '*': '1' } })).toBe('1');
  });

  it('fails where something required is missing', () => {
    expect(() => read({ selector: 'td.missing' })).toThrow(SelectorMiss);
    expect(() => read({ selector: 'a', attribute: 'data-none' })).toThrow(SelectorMiss);
    expect(() => read({ selector: 'td.size', case: { 'img.none': '0' } })).toThrow(SelectorMiss);
  });

  it('reads nothing where something optional is missing', () => {
    expect(read({ selector: 'td.missing' }, false)).toBeNull();
    expect(read({ selector: 'a', attribute: 'data-none' }, false)).toBeNull();
  });

  it('finds nothing with a selector it cannot run', () => {
    expect(read({ selector: 'td:unheard-of(' }, false)).toBeNull();
  });

  it('understands :contains and :has', () => {
    expect(read({ selector: 'td:contains("GB")' })).toBe('7.5 GB');
    expect(read({ selector: 'td:has(img.pro_free)', attribute: 'class' })).toBe('free');
  });
});
