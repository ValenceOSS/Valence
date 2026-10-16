import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useAppliedBrand } from './useAppliedBrand';

vi.mock('@ValenceClient/appearance/fetchAppearance', () => ({
  fetchAppearance: () =>
    Promise.resolve({
      roundness: 'default',
      brand: { name: 'Home Cinema', accent: null, description: null, logo: null },
    }),
}));

describe('useAppliedBrand', () => {
  it('names the document as the server is named', async () => {
    renderHookInACache(() => {
      useAppliedBrand();
    });

    await waitFor(() => {
      expect(document.title).toBe('Home Cinema');
    });
  });
});
