import { describe, expect, it } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';

describe('anAdminOverview', () => {
  it('is a server with every setting at its default, with what a test changes', () => {
    expect(anAdminOverview().settings.hasCatalogueKey).toBe(false);
    expect(anAdminOverview({ hasCatalogueKey: true }).settings.hasCatalogueKey).toBe(true);
  });
});
