import { describe, expect, it } from 'vitest';
import { ADMIN_SECTIONS } from './adminSections';
import { visibleAdminSections } from './visibleAdminSections';

describe('visibleAdminSections', () => {
  it('shows every section where requesting is on', () => {
    expect(visibleAdminSections(true).map((section) => section.label)).toEqual(
      ADMIN_SECTIONS.map((section) => section.label),
    );
  });

  it('leaves the Requests group out entirely where requesting is off', () => {
    const shown = visibleAdminSections(false);

    expect(shown.map((section) => section.label)).not.toContain('Requests');
    const ids = shown.flatMap((section) => section.items.map((item) => item.id));

    expect(ids).not.toContain('requests');
    expect(ids).not.toContain('indexers');
    expect(ids).not.toContain('search');
    expect(ids).not.toContain('downloads');
    expect(ids).not.toContain('profiles');
  });

  it('leaves everything else as it was', () => {
    expect(visibleAdminSections(false)).toHaveLength(ADMIN_SECTIONS.length - 1);
  });
});
