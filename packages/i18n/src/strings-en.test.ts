import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import screens from './screens.json';
import strings from './strings-en.json';
import values from './values-en.json';

const EntrySchema = z.object({
  value: z.string().min(1),
  usage: z.string().min(10),
  context: z.string().regex(/^\/images\/[\w.-]+\.png$/u),
});

const ScreenSchema = z.object({
  client: z.enum(['web', 'desktop', 'phone', 'tv', 'server']),
  route: z.string().min(1),
  reach: z.string().min(10),
});

const entries = Object.entries(strings);

describe('strings-en.json', () => {
  it('names every string with dotted camel-cased parts, grouped by where it is used', () => {
    for (const [key] of entries) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/u);
    }
  });

  it('gives every string its words, how it is used and a screen showing it', () => {
    for (const [, entry] of entries) {
      expect(EntrySchema.safeParse(entry).success).toBe(true);
    }
  });

  it('points every string at a screen the screens file says how to reach', () => {
    const known = new Set(Object.keys(screens));

    for (const [key, entry] of entries) {
      const screen = /^\/images\/(.+)\.png$/u.exec(entry.context)?.[1] ?? '';

      expect(known.has(screen), `${key} points at ${entry.context}`).toBe(true);
    }
  });

  it('writes both forms of anything counted, so every language can choose between them', () => {
    const keys = new Set(entries.map(([key]) => key));

    for (const key of keys) {
      if (key.endsWith('.one')) {
        expect(keys.has(key.replace(/\.one$/u, '.other')), key).toBe(true);
      }
    }
  });

  it('fills the same gaps in both forms of a count, though one may leave the number unsaid', () => {
    const gapsIn = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/gu)]
        .map((match) => match[1])
        .filter((gap) => gap !== 'count')
        .toSorted();
    const byKey = new Map(entries);

    for (const [key, entry] of entries) {
      const other = key.endsWith('.one') ? byKey.get(key.replace(/\.one$/u, '.other')) : undefined;

      if (other !== undefined) {
        expect(gapsIn(entry.value), key).toEqual(gapsIn(other.value));
      }
    }
  });
});

describe('screens.json', () => {
  it('says for every screen which client draws it, where it is and how to get there', () => {
    for (const [, screen] of Object.entries(screens)) {
      expect(ScreenSchema.safeParse(screen).success).toBe(true);
    }
  });
});

describe('values-en.json', () => {
  it('holds exactly the words of strings-en.json, so run pnpm i18n:values after changing it', () => {
    expect(values).toEqual(Object.fromEntries(entries.map(([key, entry]) => [key, entry.value])));
  });
});
