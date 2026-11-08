import { load } from 'cheerio';
import { readSize } from '@ValenceRequests/cardigann/readSize';
import type { AnnasResult } from '@ValenceRequests/annas/AnnasResult';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';

const MD5 = /^[a-f0-9]{32}$/;

const EXTENSION = /^\p{L}[\p{L}\d]{1,5}$/u;

const SIZE = /^\d+(?:\.\d+)?\s*[kmgt]?b$/i;

const YEAR = /^\d{4}$/;

/**
 * Squeezes the white space in what a page says to single spaces.
 *
 * @param text - What it says.
 * @returns The same, tidied.
 */
const tidy = (text: string): string => text.replace(/\s+/g, ' ').trim();

/**
 * Finds the line on a result card that reads like "English [en] · EPUB · 0.4MB · 2014 · …", by the
 * class Anna's Archive gives it, or else by the shape of what it says.
 *
 * @param $ - The page.
 * @param card - The result card.
 * @returns What the line says, or an empty string where the card has none.
 */
const detailsOf = ($: CheerioAPI, card: Cheerio<AnyNode>): string => {
  const marked = card
    .find('div.font-semibold.text-sm')
    .filter((_, div) => ($(div).attr('class') ?? '').includes('leading-[1.2]'))
    .first();

  if (marked.length > 0) {
    return marked.text();
  }

  const shaped = card
    .find('div')
    .filter((_, div) => {
      const text = $(div).text();

      return text.includes('·') && /\d\s*[KMG]B/.test(text) && $(div).find('div').length === 0;
    })
    .first();

  return shaped.text();
};

/**
 * Reads the books on a page of Anna's Archive search results — each one's MD5, which is how it is
 * downloaded, its title and authors, and its file type, size and year from the line beneath them —
 * card by card, so a card it cannot read costs only itself.
 *
 * @param html - The page.
 * @returns The books.
 */
const readAnnasResults = (html: string): AnnasResult[] => {
  const $ = load(html);
  const seen = new Set<string>();
  const results: AnnasResult[] = [];

  const titled = $("a.js-vim-focus[href^='/md5/']");
  const links = titled.length > 0 ? titled : $("a[href^='/md5/']");

  links.each((_, element) => {
    const link = $(element);
    const md5 = (link.attr('href') ?? '').split('/').at(-1)?.split(/[?#]/)[0] ?? '';
    const title = tidy(link.text());

    if (!MD5.test(md5) || title === '' || seen.has(md5)) {
      return;
    }

    let card = link;

    for (let step = 0; step < 6; step += 1) {
      const parent = card.parent();

      if (parent.length === 0) {
        break;
      }

      card = parent;

      if (card.hasClass('flex') && card.hasClass('pt-3')) {
        break;
      }
    }

    seen.add(md5);

    const authors = card.find("span[class*='icon-[mdi--user-edit]']").first().closest('a').text();
    const parts = detailsOf($, card)
      .split('·')
      .map((part) => tidy(part));
    const extension =
      parts.find((part) => !part.includes('[') && EXTENSION.test(part.replaceAll('-', ''))) ?? null;
    const size = parts.find((part) => SIZE.test(part));

    results.push({
      md5,
      title,
      authors: tidy(authors) === '' ? [] : [tidy(authors)],
      extension: extension === null ? null : extension.toLowerCase(),
      sizeBytes: size === undefined ? null : readSize(size),
      year: parts.find((part) => YEAR.test(part)) ?? null,
    });
  });

  return results;
};

export { readAnnasResults };
