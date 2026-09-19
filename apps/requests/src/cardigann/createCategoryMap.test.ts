import { describe, expect, it } from 'vitest';
import { createCategoryMap } from './createCategoryMap';

const MAP = createCategoryMap({
  categories: { '5': 'TV/HD', movies: 'Movies' },
  categorymappings: [
    { id: '101', cat: 'Movies/HD', desc: 'Films 1080p', default: true },
    { id: '102', cat: 'Movies/UHD', desc: 'Films 4K', default: false },
    { id: '201', cat: 'Audio', desc: undefined, default: true },
    { id: 'misc', cat: 'Other', desc: 'Everything else', default: false },
    { id: '900', cat: 'Not/A/Category', desc: 'Ignored', default: false },
    { id: '901', cat: undefined, desc: 'Only its own', default: false },
  ],
  modes: { search: ['q'] },
  allowrawsearch: false,
});

describe('createCategoryMap', () => {
  it('asks for every kind of a family when the family is asked for', () => {
    expect(MAP.toTracker([2000])).toEqual(['movies', '101', '102']);
  });

  it('asks for one kind only when that kind is asked for', () => {
    expect(MAP.toTracker([2045])).toEqual(['102']);
    expect(MAP.toTracker([5000])).toEqual(['5']);
  });

  it('asks for a site’s own category by its own number', () => {
    expect(MAP.toTracker([100_101])).toEqual(['101']);
    expect(MAP.toTracker([100_901])).toEqual(['901']);
  });

  it('asks for nothing it has no category for', () => {
    expect(MAP.toTracker([7000])).toEqual([]);
  });

  it('reads a result’s category back as the standard ones, and its own', () => {
    expect(MAP.fromTracker('101')).toEqual([2040, 100_101]);
    expect(MAP.fromTracker('MISC')[0]).toBe(8000);
    expect(MAP.fromTracker('MISC')).toHaveLength(2);
    expect(MAP.fromTracker('')).toEqual([]);
    expect(MAP.fromTracker('nope')).toEqual([]);
  });

  it('reads a result’s category by its description', () => {
    expect(MAP.fromDescription('films 4k')).toEqual([2045, 100_102]);
    expect(MAP.fromDescription(' ')).toEqual([]);
  });

  it('names the categories searched when none are asked for', () => {
    expect(MAP.defaults).toEqual(['101', '201']);
  });

  it('gives a string-named category a stable number of its own', () => {
    const [, own] = MAP.fromTracker('misc');

    expect(own).toBeGreaterThanOrEqual(100_000);
    expect(
      createCategoryMap({
        categorymappings: [{ id: 'misc', desc: 'x', default: false }],
        modes: {},
        allowrawsearch: false,
      }).fromTracker('misc'),
    ).toEqual([own]);
  });

  it('lists what the site offers as families with their kinds', () => {
    expect(MAP.standard()).toEqual([
      {
        id: 2000,
        name: 'Movies',
        subcategories: [
          { id: 2040, name: 'Movies/HD' },
          { id: 2045, name: 'Movies/UHD' },
        ],
      },
      { id: 3000, name: 'Audio', subcategories: [] },
      { id: 5000, name: 'TV', subcategories: [{ id: 5040, name: 'TV/HD' }] },
      { id: 8000, name: 'Other', subcategories: [] },
      { id: 100_101, name: 'Films 1080p', subcategories: [] },
      { id: 100_102, name: 'Films 4K', subcategories: [] },
      { id: 100_901, name: 'Only its own', subcategories: [] },
      { id: MAP.fromTracker('misc')[1] ?? 0, name: 'Everything else', subcategories: [] },
    ]);
  });
});
