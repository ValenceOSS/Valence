import { describe, expect, it } from 'vitest';
import { CHANGELOG } from './CHANGELOG';

const DASHES = /—|–|--/u;

describe('CHANGELOG', () => {
  it('lists every release once, newest first', () => {
    const slugs = CHANGELOG.map((entry) => entry.slug);
    const dates = CHANGELOG.map((entry) => entry.date);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('writes every entry without a dash for punctuation', () => {
    for (const entry of CHANGELOG) {
      const words = [
        entry.title,
        entry.summary,
        ...entry.sections.flatMap((section) => [section.title, section.body]),
        ...entry.lists.flatMap((list) => [list.title, ...list.items]),
      ];

      for (const said of words) {
        expect(said, `${entry.slug}: ${said}`).not.toMatch(DASHES);
      }
    }
  });

  it('gives each picture words for anybody who cannot see it', () => {
    for (const entry of CHANGELOG) {
      const pictures = [entry.picture, ...entry.sections.map((section) => section.picture)];

      for (const picture of pictures) {
        if (picture !== undefined) {
          expect(picture.src).toMatch(/^\/changelog\//u);
          expect(picture.alt.length).toBeGreaterThan(10);
        }
      }
    }
  });
});
