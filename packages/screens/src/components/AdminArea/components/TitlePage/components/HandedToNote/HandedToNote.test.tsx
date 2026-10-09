import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HandedToNote } from './HandedToNote';

const SONARR = {
  appId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  appName: 'Sonarr',
  appKind: 'sonarr' as const,
  link: 'http://sonarr.local:8989/series/a-show',
};

describe('HandedToNote', () => {
  it('says which app handles the title, and links to its page there', () => {
    render(<HandedToNote handedTo={SONARR} />);

    expect(screen.getByRole('region', { name: 'Handled by Sonarr' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in Sonarr' })).toHaveAttribute(
      'href',
      SONARR.link,
    );
  });

  it('offers no link where the app’s page is not known', () => {
    render(<HandedToNote handedTo={{ ...SONARR, link: null }} />);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HandedToNote.displayName).toBe('HandedToNote');
  });
});
