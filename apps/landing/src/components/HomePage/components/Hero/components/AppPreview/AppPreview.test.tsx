import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppPreview } from './AppPreview';

describe('AppPreview', () => {
  it('shows the app itself, not just a description of it', () => {
    render(<AppPreview />);

    const screenshots = screen.getAllByRole('img');

    expect(screenshots).toHaveLength(3);

    for (const screenshot of screenshots) {
      expect(screenshot.getAttribute('alt')).not.toBe('');
    }
  });

  it('centres the app on its own title page, flanked by the rest of it', () => {
    render(<AppPreview />);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app open on a title's page, with the continue-watching rail beneath it",
      }),
    ).toHaveAttribute('src', '/hero.jpeg');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AppPreview.displayName).toBe('AppPreview');
  });
});
