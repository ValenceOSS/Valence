import { waitFor } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * Waits for every card on the page to finish arriving, since a card rises in on its first frame
 * rather than being there at once, and jsdom judges what is visible by where the animation is.
 */
const waitForArrivals = async (): Promise<void> => {
  await waitFor(() => {
    for (const card of document.querySelectorAll('section.valence-card-shell')) {
      expect(card).toBeVisible();
    }
  });
};

export { waitForArrivals };
