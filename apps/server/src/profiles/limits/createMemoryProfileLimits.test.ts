import { describe, expect, it } from 'vitest';
import { createMemoryProfileLimits } from './createMemoryProfileLimits';

const CEILING = { libraryId: 'films', maximumAge: 12, allowsUnrated: false };

describe('createMemoryProfileLimits', () => {
  it('keeps a profile out of nothing until somebody says otherwise', async () => {
    const limits = createMemoryProfileLimits();

    await expect(limits.refusedLibraries('kid')).resolves.toEqual([]);
    await expect(limits.ceilingsFor('kid')).resolves.toEqual([]);
  });

  it('keeps a profile out of a library, once however often it is asked', async () => {
    const limits = createMemoryProfileLimits();

    await limits.refuseLibrary('kid', 'films');
    await limits.refuseLibrary('kid', 'films');
    await limits.refuseLibrary('kid', 'music');

    await expect(limits.refusedLibraries('kid')).resolves.toEqual(['films', 'music']);
  });

  it('lets a profile back into a library', async () => {
    const limits = createMemoryProfileLimits();

    await limits.refuseLibrary('kid', 'films');
    await limits.allowLibrary('kid', 'films');

    await expect(limits.refusedLibraries('kid')).resolves.toEqual([]);
  });

  it('lets a profile into a library it was never kept from without complaint', async () => {
    const limits = createMemoryProfileLimits();

    await limits.allowLibrary('kid', 'films');

    await expect(limits.refusedLibraries('kid')).resolves.toEqual([]);
  });

  it('keeps one profile’s limits from another’s', async () => {
    const limits = createMemoryProfileLimits();

    await limits.refuseLibrary('kid', 'films');
    await limits.setCeiling('kid', CEILING);

    await expect(limits.refusedLibraries('parent')).resolves.toEqual([]);
    await expect(limits.ceilingsFor('parent')).resolves.toEqual([]);
  });

  it('caps the age of what a profile sees in a library', async () => {
    const limits = createMemoryProfileLimits();

    await limits.setCeiling('kid', CEILING);

    await expect(limits.ceilingsFor('kid')).resolves.toEqual([CEILING]);
  });

  it('keeps one cap per library, the latest', async () => {
    const limits = createMemoryProfileLimits();

    await limits.setCeiling('kid', CEILING);
    await limits.setCeiling('kid', { ...CEILING, maximumAge: 15, allowsUnrated: true });
    await limits.setCeiling('kid', { libraryId: 'shows', maximumAge: 7, allowsUnrated: false });

    await expect(limits.ceilingsFor('kid')).resolves.toEqual([
      { libraryId: 'films', maximumAge: 15, allowsUnrated: true },
      { libraryId: 'shows', maximumAge: 7, allowsUnrated: false },
    ]);
  });

  it('lifts a cap in one library and leaves the others', async () => {
    const limits = createMemoryProfileLimits();

    await limits.setCeiling('kid', CEILING);
    await limits.setCeiling('kid', { libraryId: 'shows', maximumAge: 7, allowsUnrated: false });
    await limits.clearCeiling('kid', 'films');

    await expect(limits.ceilingsFor('kid')).resolves.toEqual([
      { libraryId: 'shows', maximumAge: 7, allowsUnrated: false },
    ]);
  });

  it('keeps refusals and caps apart', async () => {
    const limits = createMemoryProfileLimits();

    await limits.setCeiling('kid', CEILING);
    await limits.refuseLibrary('kid', 'films');
    await limits.clearCeiling('kid', 'films');

    await expect(limits.refusedLibraries('kid')).resolves.toEqual(['films']);
  });
});
